export declare class GPUSetting {
    static BYTE_SIZE: number;
    protected f32: Float32Array;
    protected u32: Uint32Array;
    constructor(buffer: ArrayBuffer);
}
export declare class CPUSetting {
}
export interface GPUSettingClass<G extends GPUSetting> {
    new (buffer: ArrayBuffer): G;
    BYTE_SIZE: number;
}
export interface ParamsBufferOptions<G extends GPUSetting, C extends CPUSetting> {
    gpu: GPUSettingClass<G>;
    cpu?: new () => C;
}
export declare class ParamsBuffer<G extends GPUSetting = GPUSetting, C extends CPUSetting = CPUSetting> {
    private buffer;
    readonly byteSize: number;
    readonly gpu: G;
    readonly cpu: C;
    constructor(options: ParamsBufferOptions<G, C>);
    /** GPU uniform으로 전송할 ArrayBuffer */
    get data(): ArrayBuffer;
}
//# sourceMappingURL=params_buffer.d.ts.map