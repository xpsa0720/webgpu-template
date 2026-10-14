import { Pass } from "./pass";
// workgroup size는 셰이더의 @workgroup_size(...)에서 정한다
// - 숫자 / 리터럴로 초기화된 const·override → 그 값 고정
// - @X_AUTO / @Y_AUTO / @Z_AUTO → 라이브러리 레벨 auto-tuning 대상 (실측으로 최적 크기 선택)
// - 인자가 없는 축 → 0 (축 없음)
// @workgroup_size(...) 속성. 공백/줄바꿈과 한 단계 중첩 괄호(min(...) 등)까지 인자로 캡처
const WORKGROUP_SIZE_ATTR = /@\s*workgroup_size\s*\(((?:[^()]|\([^()]*\))*)\)/g;
// 축별 auto-tuning 플레이스홀더
const AUTO_PLACEHOLDER = [/@X_AUTO\b/, /@Y_AUTO\b/, /@Z_AUTO\b/];
// auto-tuning 대상 축에 튜닝 전까지 적용하는 기본 workgroup size
// @workgroup_size 인자 개수(1D/2D/3D)별 축당 크기 → 모두 워크그룹당 64 invocation
const DEFAULT_AUTO_WORKGROUP_SIZE = { 1: 64, 2: 8, 3: 4 };
// 다른 entry point의 플레이스홀더는 컴파일만 되면 되므로 어떤 차원이어도 한도를 넘지 않는 값으로 치환
const FALLBACK_PLACEHOLDER_SIZE = 4;
// WGSL 정수 리터럴 (10진/16진, i/u 접미사)
const INT_LITERAL = /^(0[xX][0-9a-fA-F]+|\d+)[iu]?$/;
export class ComputePass extends Pass {
    workgroupSizeX;
    workgroupSizeY;
    workgroupSizeZ;
    // [X, Y, Z] 축별 auto-tuning 대상 여부
    autoWorkgroupSize;
    // 플레이스홀더 치환 전 원본 셰이더 코드 (this.shaderCode는 치환 후 컴파일된 코드)
    shaderCodeTemplate;
    computeTargetCountX;
    computeTargetCountY;
    computeTargetCountZ;
    pipeline;
    debugMode;
    bindGroup = null;
    bindGroupTex = null;
    bindGroupSampler = null;
    constructor(arg) {
        // Pass 생성자가 셰이더를 컴파일하므로 workgroup size를 먼저 확정하고 플레이스홀더를 치환해 넘긴다
        const label = arg.label ?? "";
        const attrArgs = ComputePass.findWorkgroupSizeArgs(arg.shaderCode, arg.entryPoint);
        if (!attrArgs) {
            throw new Error(`ComputePass "${label}": @workgroup_size for entry point "${arg.entryPoint}" not found`);
        }
        const resolved = [0, 1, 2].map((axis) => ComputePass.resolveSize(axis, attrArgs, arg.shaderCode, label));
        super({
            ...arg,
            shaderCode: ComputePass.applyWorkgroupSize(arg.shaderCode, resolved.map((r) => r.size), attrArgs),
        });
        if (!arg.device) {
            throw Error("Device not initialized");
        }
        this.debugMode = arg.debugMode ?? false;
        this.shaderCodeTemplate = arg.shaderCode;
        this.autoWorkgroupSize = [resolved[0].isAuto, resolved[1].isAuto, resolved[2].isAuto];
        this.workgroupSizeX = resolved[0].size;
        this.workgroupSizeY = resolved[1].size;
        this.workgroupSizeZ = resolved[2].size;
        this.computeTargetCountX = arg.computeTargetCountX;
        this.computeTargetCountY = arg.computeTargetCountY ?? 0;
        this.computeTargetCountZ = arg.computeTargetCountZ ?? 0;
        this.pipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: {
                entryPoint: arg.entryPoint,
                module: this.shaderModule,
            },
        });
    }
    createPass(encoder, debugArg) {
        this.preEncoderCallback?.(encoder);
        if (!this.bindGroup) {
            const entries = [];
            for (const [key, value] of Object.entries(this.buffers)) {
                entries.push({
                    binding: Number(key),
                    resource: { buffer: value.buffer },
                });
            }
            this.bindGroup = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: entries,
            });
        }
        if (!this.bindGroupTex && Object.keys(this.textures).length > 0) {
            const entries_tex = [];
            for (const [key, value] of Object.entries(this.textures)) {
                entries_tex.push({
                    binding: Number(key),
                    resource: value.texture.createView(),
                });
            }
            this.bindGroupTex = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(1),
                entries: entries_tex,
            });
        }
        if (!this.bindGroupSampler && Object.keys(this.sampler).length > 0) {
            const entries_sampler = [];
            for (const [key, value] of Object.entries(this.sampler)) {
                entries_sampler.push({
                    binding: Number(key),
                    resource: value.sampler,
                });
            }
            this.bindGroupSampler = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(2),
                entries: entries_sampler,
            });
        }
        const passArg = debugArg?.time && this.debugMode
            ? {
                timestampWrites: {
                    querySet: debugArg.querySet,
                    beginningOfPassWriteIndex: debugArg.time?.startIndex,
                    endOfPassWriteIndex: debugArg.time?.endIndex,
                },
            }
            : {};
        const pass = encoder.beginComputePass(passArg);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        if (this.bindGroupTex) {
            pass.setBindGroup(1, this.bindGroupTex);
        }
        if (this.bindGroupSampler) {
            pass.setBindGroup(2, this.bindGroupSampler);
        }
        pass.dispatchWorkgroups(this.dispatchCount(this.computeTargetCountX, this.workgroupSizeX) ?? 0, this.dispatchCount(this.computeTargetCountY, this.workgroupSizeY), this.dispatchCount(this.computeTargetCountZ, this.workgroupSizeZ));
        pass.end();
        return super.createPass(encoder);
    }
    // entryPoint 함수에 붙은 @workgroup_size(...)의 축별 인자 (주석 제거, 최상위 콤마로 분리)
    // 해당 속성을 못 찾으면 null
    static findWorkgroupSizeArgs(shaderCode, entryPoint) {
        for (const match of shaderCode.matchAll(WORKGROUP_SIZE_ATTR)) {
            const rest = shaderCode.slice(match.index + match[0].length);
            const fnName = /\bfn\s+([A-Za-z_]\w*)/.exec(rest)?.[1];
            if (fnName !== entryPoint)
                continue;
            const args = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
            const parts = [];
            let depth = 0;
            let current = "";
            for (const ch of args) {
                if (ch === "(")
                    depth++;
                if (ch === ")")
                    depth--;
                if (ch === "," && depth === 0) {
                    parts.push(current.trim());
                    current = "";
                }
                else {
                    current += ch;
                }
            }
            if (current.trim())
                parts.push(current.trim());
            return parts;
        }
        return null;
    }
    // 플레이스홀더 → auto-tuning 대상 (튜닝 전까지 기본값)
    // 그 외 → 셰이더 @workgroup_size의 값 추출, 인자가 없으면 0(축 없음)
    static resolveSize(axis, attrArgs, shaderCode, label) {
        if (attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a))) {
            return { size: DEFAULT_AUTO_WORKGROUP_SIZE[attrArgs.length], isAuto: true };
        }
        const expr = attrArgs[axis];
        if (expr === undefined)
            return { size: 0, isAuto: false };
        const value = ComputePass.evalIntExpr(expr, shaderCode);
        if (value === null) {
            throw new Error(`ComputePass "${label}": cannot resolve @workgroup_size ${"XYZ"[axis]} value "${expr}"; use an integer literal, a const/override initialized with one, or @${"XYZ"[axis]}_AUTO`);
        }
        return { size: value, isAuto: false };
    }
    // 플레이스홀더를 축별 현재 workgroup size로 치환
    // 이 entryPoint의 @workgroup_size에 없는 플레이스홀더(다른 entry point 등)는 컴파일만 되도록 기본값으로 치환
    static applyWorkgroupSize(shaderCode, sizes, attrArgs) {
        let code = shaderCode;
        for (let axis = 0; axis < 3; axis++) {
            const inEntry = attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a));
            const value = inEntry ? sizes[axis] : FALLBACK_PLACEHOLDER_SIZE;
            code = code.replace(new RegExp(AUTO_PLACEHOLDER[axis].source, "g"), String(value));
        }
        return code;
    }
    // 정수 리터럴 또는 리터럴로 초기화된 const/override 식별자만 해석, 그 외는 null
    static evalIntExpr(expr, shaderCode) {
        const literal = INT_LITERAL.exec(expr);
        if (literal)
            return Number(literal[1]);
        if (!/^[A-Za-z_]\w*$/.test(expr))
            return null;
        const decl = new RegExp(`\\b(?:const|override)\\s+${expr}\\s*(?::\\s*\\w+)?\\s*=\\s*([^;]+);`).exec(shaderCode);
        if (!decl)
            return null;
        const init = INT_LITERAL.exec(decl[1].trim());
        return init ? Number(init[1]) : null;
    }
    // 축이 없으면(target count 0 또는 workgroup size 0) undefined
    dispatchCount(count, size) {
        if (count <= 0 || size === 0)
            return undefined;
        return Math.ceil(count / size);
    }
}
//# sourceMappingURL=compute_pass.js.map