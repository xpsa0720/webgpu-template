import type { WebGPUBuffer } from "./resource";
export type EncoderCallback = (encoder: GPUCommandEncoder) => void;
export type PassCallback<B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>> = (arg: PassCallbackArg<B>) => void;
export interface PassCallbackArg<B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>> {
    device: GPUDevice;
    gpuBuffers: B;
    dt: number;
    encoder?: GPUCommandEncoder;
}
//# sourceMappingURL=callback.d.ts.map