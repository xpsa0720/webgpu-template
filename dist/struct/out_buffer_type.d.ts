declare const PrintType: {
    readonly u32: "u32";
    readonly f32: "f32";
};
export type PrintType = (typeof PrintType)[keyof typeof PrintType];
export {};
//# sourceMappingURL=out_buffer_type.d.ts.map