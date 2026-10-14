import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { PrintType } from "./struct/out_buffer_type";
import type { PrintGPUBuffer } from "./struct/print_gpu_buffer";

const WORKGROUP_SIZE_ATTR = /@\s*workgroup_size\s*\(((?:[^()]|\([^()]*\))*)\)/g;
const AUTO_PLACEHOLDER = [/@X_AUTO\b/, /@Y_AUTO\b/, /@Z_AUTO\b/] as const;
const DEFAULT_AUTO_WORKGROUP_SIZE: Record<number, number> = { 1: 64, 2: 8, 3: 4 };
const FALLBACK_PLACEHOLDER_SIZE = 4;
const INT_LITERAL = /^(0[xX][0-9a-fA-F]+|\d+)[iu]?$/;

type AxisFlags = [boolean, boolean, boolean];

export interface ComputePassArg extends PassArg {
  computeTargetCountX: number;
  computeTargetCountY?: number;
  computeTargetCountZ?: number;
  entryPoint: string;
  debugMode?: boolean;
}

export interface OutGPUBuffer {
  staginigBuffer: GPUBuffer;
  label: string;
  type: PrintType;
  print?: PrintGPUBuffer;
}

export class ComputePass extends Pass {
  workgroupSizeX: number;
  workgroupSizeY: number;
  workgroupSizeZ: number;
  autoWorkgroupSize: AxisFlags;
  shaderCodeTemplate: string;
  computeTargetCountX: number;
  computeTargetCountY: number;
  computeTargetCountZ: number;
  pipeline: GPUComputePipeline;
  private debugMode: boolean;
  private bindGroup: GPUBindGroup | null = null;
  private bindGroupTex: GPUBindGroup | null = null;
  private bindGroupSampler: GPUBindGroup | null = null;
  constructor(arg: ComputePassArg) {
    const label = arg.label ?? "";
    const attrArgs = ComputePass.findWorkgroupSizeArgs(arg.shaderCode, arg.entryPoint);
    if (!attrArgs) {
      throw new Error(
        `ComputePass "${label}": @workgroup_size for entry point "${arg.entryPoint}" not found`,
      );
    }
    const resolved = [0, 1, 2].map((axis) =>
      ComputePass.resolveSize(axis, attrArgs, arg.shaderCode, label),
    );
    super({
      ...arg,
      shaderCode: ComputePass.applyWorkgroupSize(
        arg.shaderCode,
        resolved.map((r) => r.size),
        attrArgs,
      ),
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

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.preEncoderCallback?.(encoder);

    if (!this.bindGroup) {
      const entries: Array<GPUBindGroupEntry> = [];
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
      const entries_tex: Array<GPUBindGroupEntry> = [];
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
      const entries_sampler: Array<GPUBindGroupEntry> = [];
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

    const passArg: GPUComputePassDescriptor =
      debugArg?.time && this.debugMode
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
    pass.dispatchWorkgroups(
      this.dispatchCount(this.computeTargetCountX, this.workgroupSizeX) ?? 0,
      this.dispatchCount(this.computeTargetCountY, this.workgroupSizeY),
      this.dispatchCount(this.computeTargetCountZ, this.workgroupSizeZ),
    );
    pass.end();
    return super.createPass(encoder);
  }

  private static findWorkgroupSizeArgs(
    shaderCode: string,
    entryPoint: string,
  ): string[] | null {
    for (const match of shaderCode.matchAll(WORKGROUP_SIZE_ATTR)) {
      const rest = shaderCode.slice(match.index + match[0].length);
      const fnName = /\bfn\s+([A-Za-z_]\w*)/.exec(rest)?.[1];
      if (fnName !== entryPoint) continue;

      const args = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
      const parts: string[] = [];
      let depth = 0;
      let current = "";
      for (const ch of args) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) {
          parts.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim()) parts.push(current.trim());
      return parts;
    }
    return null;
  }

  private static resolveSize(
    axis: number,
    attrArgs: string[],
    shaderCode: string,
    label: string,
  ): { size: number; isAuto: boolean } {
    if (attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a))) {
      return { size: DEFAULT_AUTO_WORKGROUP_SIZE[attrArgs.length], isAuto: true };
    }

    const expr = attrArgs[axis];
    if (expr === undefined) return { size: 0, isAuto: false };
    const value = ComputePass.evalIntExpr(expr, shaderCode);
    if (value === null) {
      throw new Error(
        `ComputePass "${label}": cannot resolve @workgroup_size ${"XYZ"[axis]} value "${expr}"; use an integer literal, a const/override initialized with one, or @${"XYZ"[axis]}_AUTO`,
      );
    }
    return { size: value, isAuto: false };
  }

  private static applyWorkgroupSize(
    shaderCode: string,
    sizes: number[],
    attrArgs: string[],
  ): string {
    let code = shaderCode;
    for (let axis = 0; axis < 3; axis++) {
      const inEntry = attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a));
      const value = inEntry ? sizes[axis] : FALLBACK_PLACEHOLDER_SIZE;
      code = code.replace(new RegExp(AUTO_PLACEHOLDER[axis].source, "g"), String(value));
    }
    return code;
  }

  private static evalIntExpr(expr: string, shaderCode: string): number | null {
    const literal = INT_LITERAL.exec(expr);
    if (literal) return Number(literal[1]);

    if (!/^[A-Za-z_]\w*$/.test(expr)) return null;
    const decl = new RegExp(
      `\\b(?:const|override)\\s+${expr}\\s*(?::\\s*\\w+)?\\s*=\\s*([^;]+);`,
    ).exec(shaderCode);
    if (!decl) return null;
    const init = INT_LITERAL.exec(decl[1].trim());
    return init ? Number(init[1]) : null;
  }

  private dispatchCount(count: number, size: number): number | undefined {
    if (count <= 0 || size === 0) return undefined;
    return Math.ceil(count / size);
  }
}
