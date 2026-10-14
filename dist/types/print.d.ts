declare const PrintType: {
    readonly u32: "u32";
    readonly f32: "f32";
};
export type PrintType = (typeof PrintType)[keyof typeof PrintType];
export interface FormatStyle {
    format: string;
    styles: string[];
}
export type PrintGPUBuffer = (arg: PrintGPUBufferArg) => FormatStyle;
export interface PrintGPUBufferArg {
    array: Float32Array | Uint32Array;
}
export {};
//# sourceMappingURL=print.d.ts.map