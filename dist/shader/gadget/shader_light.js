import { gpuBufferSizeFormat, wgslStructSize } from "../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../util/uniform";
import { roundUp } from "../../util/vertex_layout";
import { ShaderGadget } from "./shader_gadget";
import { SHADER_DIRECTIONAL_LIGHT_PV_MATRIX, SHADER_DIRECTIONAL_SHADOW_TEXTURE, SHADER_POINT_LIGHT_PV_MATRIX, SHADER_POINT_SHADOW_TEXTURE, } from "./code/shader_code";
export const formatLightCount = 8;
export class ShaderLightGadget extends ShaderGadget {
    struct;
    define;
    group;
    structSize;
    func;
    // instanceCode: string;
    // instanceFunc: string;
    device;
    code;
    binding;
    gpuBuffer;
    countPlaceholder;
    _lights;
    onLightChange;
    _bufferCapacity = 0; // 현재 버퍼가 수용 가능한 light 수 (roundUp 단위)
    constructor({ struct, define, placeholder, binding, group, code, device, func, 
    // instanceFunc,
    // instanceCode,
    lights = [], countPlaceholder, onLightChange, }) {
        super({ placeholder: { [countPlaceholder]: "0", ...placeholder } });
        this.struct = struct;
        this.define = define;
        this.group = group;
        this.structSize = wgslStructSize(struct);
        this.code = code;
        this.device = device;
        this.func = func;
        // this.instanceFunc = instanceFunc;
        // this.instanceCode = instanceCode;
        this.binding = binding;
        this._lights = lights;
        this.countPlaceholder = countPlaceholder;
        this.onLightChange = onLightChange;
        this.gpuBuffer = this.createBuffer();
        lights.forEach((l) => this.addLight(l));
    }
    createBuffer() {
        this._bufferCapacity = Math.max(1, roundUp(formatLightCount, this._lights.length));
        const buffer = this.device.createBuffer({
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            size: this.structSize * this._bufferCapacity,
        });
        const data = uniformDataArray(this.struct, this.lights);
        this.device.queue.writeBuffer(buffer, 0, data);
        return { buffer };
    }
    /** 버퍼 용량이 충분하면 writeBuffer만, 부족하면 새로 생성 */
    ensureBuffer() {
        const needed = Math.max(1, roundUp(formatLightCount, this._lights.length));
        if (needed > this._bufferCapacity) {
            this.gpuBuffer.buffer.destroy();
            this.gpuBuffer = this.createBuffer();
        }
        else {
            const data = uniformDataArray(this.struct, this.lights);
            this.device.queue.writeBuffer(this.gpuBuffer.buffer, 0, data);
        }
    }
    get lights() {
        return this._lights;
    }
    set lights(value) {
        this._lights = value;
        this.updateCount();
        this.ensureBuffer();
        this.onLightChange?.();
    }
    addLight(light) {
        this._lights.push(light);
        this.updateCount();
        this.ensureBuffer();
        this.onLightChange?.();
    }
    removeLight(index) {
        const removed = this._lights.splice(index, 1)[0];
        this.updateCount();
        this.ensureBuffer();
        this.onLightChange?.();
        return removed;
    }
    updateCount() {
        this.placeholder[this.countPlaceholder] = String(Math.max(1, roundUp(formatLightCount, this._lights.length)));
    }
    updateLight(index) {
        const data = uniformData(this.struct, this.lights[index]);
        this.device.queue.writeBuffer(this.gpuBuffer.buffer, index * this.structSize, data);
        this.onLightChange?.();
    }
    updateLightAll() {
        const data = uniformDataArray(this.struct, this.lights);
        this.device.queue.writeBuffer(this.gpuBuffer.buffer, 0, data);
        this.onLightChange?.();
    }
    getCode() {
        if (this._lights.length === 0)
            return "";
        return super.getCode(this.code);
    }
    getFunctionCode() {
        if (this._lights.length === 0)
            return "";
        return super.getCode(this.func);
    }
    getStructUniformCode() {
        if (this._lights.length === 0)
            return "";
        let result = "";
        result += this.struct + "\n";
        result += this.define + "\n";
        return super.getCode(result);
    }
}
export class ShaderAmbientLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
export class ShaderPointLightGadget extends ShaderLightGadget {
    shadowPvMatrixDefine;
    shadowTextureDefine;
    shadowAddFunc;
    shadowAddCode;
    constructor(params) {
        super({
            ...params,
            placeholder: {
                ...params.placeholder,
                "@POINT_LIGHT_COMPARE_CODE": "",
                "@POINT_SHADOW_VISIBILTY_FUNC_CODE": "",
            },
        });
        this.shadowPvMatrixDefine = SHADER_POINT_LIGHT_PV_MATRIX;
        this.shadowTextureDefine = SHADER_POINT_SHADOW_TEXTURE;
        this.shadowAddFunc = params.shadowAddFunc;
        this.shadowAddCode = params.shadowAddCode;
    }
    /** castShadow인 조명이 하나라도 있는지 — false면 셰이더에서 그림자 관련 코드를 전부 뺀다 */
    get hasShadow() {
        return this.lights.some((l) => l.castShadow);
    }
    // 그림자 비교 / visibility 코드 placeholder를 hasShadow에 맞춰 채우거나 비운다
    syncShadowPlaceholder() {
        this.placeholder["@POINT_LIGHT_COMPARE_CODE"] = this.getShadowAddCode();
        this.placeholder["@POINT_SHADOW_VISIBILTY_FUNC_CODE"] = this.getShadowAddFuncCode();
    }
    getCode() {
        this.syncShadowPlaceholder();
        return super.getCode();
    }
    getFunctionCode() {
        this.syncShadowPlaceholder();
        return super.getFunctionCode();
    }
    getShadowDefinesCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
    }
    getShadowAddCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddCode;
    }
    getShadowAddFuncCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddFunc;
    }
}
export class ShaderDirectionalLightGadget extends ShaderLightGadget {
    shadowPvMatrixDefine;
    shadowTextureDefine;
    shadowAddFunc;
    shadowAddCode;
    constructor(params) {
        super({
            ...params,
            placeholder: {
                ...params.placeholder,
                "@DIRECTIONAL_LIGHT_COMPARE_CODE": "",
                "@DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE": "",
            },
        });
        this.shadowPvMatrixDefine = SHADER_DIRECTIONAL_LIGHT_PV_MATRIX;
        this.shadowTextureDefine = SHADER_DIRECTIONAL_SHADOW_TEXTURE;
        this.shadowAddFunc = params.shadowAddFunc;
        this.shadowAddCode = params.shadowAddCode;
    }
    /** castShadow인 조명이 하나라도 있는지 — false면 셰이더에서 그림자 관련 코드를 전부 뺀다 */
    get hasShadow() {
        return this.lights.some((l) => l.castShadow);
    }
    // 그림자 비교 / visibility 코드 placeholder를 hasShadow에 맞춰 채우거나 비운다
    syncShadowPlaceholder() {
        this.placeholder["@DIRECTIONAL_LIGHT_COMPARE_CODE"] = this.getShadowAddCode();
        this.placeholder["@DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE"] = this.getShadowAddFuncCode();
    }
    getCode() {
        this.syncShadowPlaceholder();
        return super.getCode();
    }
    getFunctionCode() {
        this.syncShadowPlaceholder();
        return super.getFunctionCode();
    }
    getShadowDefinesCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
    }
    getShadowAddCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddCode;
    }
    getShadowAddFuncCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddFunc;
    }
}
//# sourceMappingURL=shader_light.js.map