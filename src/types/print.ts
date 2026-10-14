export interface FormatStyle {
  format: string;
  styles: string[];
}

export type PrintGPUBuffer = (arg: PrintGPUBufferArg) => FormatStyle;
export interface PrintGPUBufferArg {
  array: Float32Array | Uint32Array;
}
