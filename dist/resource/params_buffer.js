export class GPUSetting {
    static BYTE_SIZE;
    f32;
    u32;
    constructor(buffer) {
        this.f32 = new Float32Array(buffer);
        this.u32 = new Uint32Array(buffer);
    }
}
export class CPUSetting {
}
export class ParamsBuffer {
    buffer;
    byteSize;
    gpu;
    cpu;
    constructor(options) {
        const GPUClass = options.gpu;
        const CPUClass = (options.cpu ?? CPUSetting);
        const size = GPUClass.BYTE_SIZE;
        if (!Number.isInteger(size) || size <= 0 || size % 16 !== 0) {
            throw new Error(`${GPUClass.name}.BYTE_SIZE must be a positive multiple of 16 (got ${size})`);
        }
        this.byteSize = size;
        this.buffer = new ArrayBuffer(this.byteSize);
        this.gpu = new GPUClass(this.buffer);
        this.cpu = new CPUClass();
    }
    /** GPU uniform으로 전송할 ArrayBuffer */
    get data() {
        return this.buffer;
    }
}
//# sourceMappingURL=params_buffer.js.map