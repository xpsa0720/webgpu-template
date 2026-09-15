import type { AppBuffers } from "../../shader_queue";

export type PassCallback = (arg: PassCallbackArg) => void;
export interface PassCallbackArg {
  device: GPUDevice;
  gpuBuffers: AppBuffers;
  dt: number;
  encoder?: GPUCommandEncoder;
}
