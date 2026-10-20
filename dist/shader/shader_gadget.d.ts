export interface ShaderStructGadgetParams {
    uniform: string;
    struct: string;
    placeholder?: Record<string, string>;
}
export declare class ShaderStructGadget {
    uniform: string;
    struct: string;
    placeholder: Record<string, string>;
    constructor({ uniform, struct, placeholder }: ShaderStructGadgetParams);
    getCode(): string;
}
//# sourceMappingURL=shader_gadget.d.ts.map