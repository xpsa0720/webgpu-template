import { gpuBufferSizeFormat, wgslStructSize } from "../../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../../util/uniform";
import { roundUp } from "../../../util/vertex_layout";
import { ShaderGadget } from "../shader_gadget";
export const formatLightCount = 8;
export class ShaderLightGadget extends ShaderGadget {
    struct;
    define;
    group;
    structSize;
    func;
    device;
    code;
    binding;
    gpuBuffer;
    countPlaceholder;
    _lights;
    onLightChange;
    _bufferCapacity = 0; // 현재 버퍼가 수용 가능한 light 수 (roundUp 단위)
    constructor({ struct, define, placeholder, binding, group, code, device, func, lights = [], countPlaceholder, onLightChange, }) {
        super({ placeholder: { [countPlaceholder]: "0", ...placeholder } });
        this.struct = struct;
        this.define = define;
        this.group = group;
        this.structSize = wgslStructSize(struct);
        this.code = code;
        this.device = device;
        this.func = func;
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
//# sourceMappingURL=shader_light_gadget.js.map