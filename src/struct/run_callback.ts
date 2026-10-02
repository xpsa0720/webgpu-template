import type { WebGPUBuffer } from "./webgpu_buffer";

export type PassCallback<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
> = (arg: PassCallbackArg<B>) => void;

export interface PassCallbackArg<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
> {
  device: GPUDevice;
  gpuBuffers: B;
  dt: number;
  encoder?: GPUCommandEncoder;
}
