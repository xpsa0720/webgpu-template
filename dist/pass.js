export class Pass {
    buffers;
    textures;
    sampler;
    shaderCode;
    shaderModule;
    device;
    label;
    time;
    encoderCallback;
    preEncoderCallback;
    constructor(arg) {
        if (!arg.device) {
            throw Error("Device not initialized");
        }
        this.shaderCode = arg.shaderCode;
        this.buffers = [];
        this.textures = [];
        this.sampler = [];
        this.device = arg.device;
        this.shaderModule = this.device.createShaderModule({
            code: this.shaderCode,
        });
        this.label = arg.label ?? "";
        this.time = arg.time;
        this.encoderCallback = arg.encoderCallback;
        this.preEncoderCallback = arg.preEncoderCallback;
    }
    writeBuffer(bindingBuffers) {
        bindingBuffers.forEach((buffer) => {
            const bindigIdx = buffer.bindigIdx;
            const bufferObj = buffer.bufferObj;
            const isPrint = buffer.isPrint;
            const label = buffer.label;
            const type = buffer.type ?? "f32";
            const print = buffer.print;
            if (this.buffers[bindigIdx]) {
                throw Error("Binding index already occupied");
            }
            const buf = {
                buffer: bufferObj.buffer,
                label: label ?? "None Label",
                isPrint: isPrint ?? false,
                type: type,
                print: print,
            };
            this.buffers[bindigIdx] = buf;
        });
    }
    writeTexture(bindingTextures) {
        bindingTextures.forEach((texture) => {
            const bindigIdx = texture.bindigIdx;
            const bufferObj = texture.textureObj;
            const label = texture.label;
            if (this.textures[bindigIdx]) {
                throw Error("Binding index already occupied");
            }
            const tex = {
                texture: bufferObj.texture,
                label: label ?? "None Label",
            };
            this.textures[bindigIdx] = tex;
        });
    }
    writeSampler(bindingSampler) {
        bindingSampler.forEach((sampler) => {
            const bindigIdx = sampler.bindigIdx;
            const bufferObj = sampler.samplerObj;
            const label = sampler.label;
            if (this.sampler[bindigIdx]) {
                throw Error("Binding index already occupied");
            }
            const sam = {
                sampler: bufferObj.sampler,
                label: label ?? "None Label",
            };
            this.sampler[bindigIdx] = sam;
        });
    }
    deleteBuffer(bindigIdx) {
        if (!this.buffers[bindigIdx]) {
            throw Error("No buffer at this binding index");
        }
        delete this.buffers[bindigIdx];
    }
    createPass(encoder, debugArg) {
        const stagingBuffers = [];
        for (const [, value] of Object.entries(this.buffers)) {
            if (!value.isPrint) {
                continue;
            }
            const stagingBuffer = this.device.createBuffer({
                size: value.buffer.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            const buffer = value.buffer;
            encoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, buffer.size);
            stagingBuffers.push({
                staginigBuffer: stagingBuffer,
                label: value.label,
                type: value.type,
                print: value.print,
            });
        }
        // if (this.encoderCallback) this.encoderCallback(encoder);
        return stagingBuffers;
    }
}
//# sourceMappingURL=pass.js.map