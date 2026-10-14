const PrintType = {
  u32: "u32",
  f32: "f32",
} as const;

export type PrintType = (typeof PrintType)[keyof typeof PrintType];

export interface FormatStyle {
  format: string;
  styles: string[];
}

export type PrintGPUBuffer = (arg: PrintGPUBufferArg) => FormatStyle;
export interface PrintGPUBufferArg {
  array: Float32Array | Uint32Array;
}
