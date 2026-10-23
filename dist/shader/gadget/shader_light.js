import { Vector4 } from "../../3d/math/vector";
import { gpuBufferSizeFormat, wgslStructSize } from "../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../util/uniform";
import { ShaderGadget } from "./shader_gadget";
export class ShaderLightGadget extends ShaderGadget {
    struct;
    define;
    group;
    structSize;
    func;
    // instanceFunc: string;
    // instanceCode: string;
    device;
    code;
    binding;
    gpuBuffer;
    countPlaceholder;
    _lights;
    onLightChange;
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
        const buffer = this.device.createBuffer({
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            size: this.structSize * Math.max(1, this._lights.length),
        });
        const data = uniformDataArray(this.struct, this.lights);
        this.device.queue.writeBuffer(buffer, 0, data);
        return {
            buffer,
        };
    }
    get lights() {
        return this._lights;
    }
    set lights(value) {
        this._lights = value;
        this.updateCount();
        this.gpuBuffer = this.createBuffer();
        this.onLightChange?.();
    }
    addLight(light) {
        this._lights.push(light);
        this.updateCount();
        this.gpuBuffer = this.createBuffer();
        this.onLightChange?.();
    }
    removeLight(index) {
        const removed = this._lights.splice(index, 1)[0];
        this.updateCount();
        this.gpuBuffer = this.createBuffer();
        this.onLightChange?.();
        return removed;
    }
    updateCount() {
        this.placeholder[this.countPlaceholder] = String(Math.max(1, this._lights.length));
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
    // getInstanceCode() {
    //   if (this._lights.length === 0) return "";
    //   return super.getCode(this.instanceCode);
    // }
    // getInstanceFunctionCode() {
    //   if (this._lights.length === 0) return "";
    //   return super.getCode(this.instanceFunc);
    // }
    getStructUniformCode() {
        if (this._lights.length === 0)
            return "";
        let result = "";
        result += this.struct + "\n";
        result += this.define + "\n";
        return super.getCode(result);
    }
}
export class Light {
    intensity;
    color;
    constructor({ intensity = 1, color = new Vector4(1, 1, 1, 1) } = {}) {
        this.intensity = intensity;
        this.color = color;
    }
}
export class AmbientLight extends Light {
    constructor(params = {}) {
        super(params);
    }
}
export class PointLight extends Light {
    position;
    constructor({ position = new Vector4(0, 0, 0, 1), ...rest } = {}) {
        super(rest);
        this.position = position;
    }
}
export class DirectionalLight extends Light {
    directional;
    constructor({ directional = new Vector4(0, -1, 0, 0), ...rest } = {}) {
        super(rest);
        this.directional = directional;
    }
}
export class ShaderAmbientLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
export class ShaderPointLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
export class ShaderDirectionalLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
//# sourceMappingURL=shader_light.js.map