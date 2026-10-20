export interface ShaderGadgetParams {
    placeholder?: Record<string, string>;
}
export declare abstract class ShaderGadget {
    placeholder: Record<string, string>;
    constructor({ placeholder }: ShaderGadgetParams);
    getCode(code: string): string;
}
//# sourceMappingURL=shader_gadget.d.ts.map