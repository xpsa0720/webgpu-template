import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderStructGadgetParams extends ShaderGadgetParams {
    struct: string;
}
export declare class ShaderStructGadget extends ShaderGadget {
    struct: string;
    constructor({ struct, placeholder }: ShaderStructGadgetParams);
    getCode(): string;
}
//# sourceMappingURL=shader_struct.d.ts.map