import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderbindingGadgetParams extends ShaderGadgetParams {
    define: string;
    type: 'texture' | 'uniform' | 'stoarge' | 'sampler';
}
export declare class ShaderbindingGadget extends ShaderGadget {
    define: string;
    type: 'texture' | 'uniform' | 'stoarge' | 'sampler';
    constructor({ define, placeholder, type }: ShaderbindingGadgetParams);
    getCode(): string;
}
//# sourceMappingURL=shader_binding.d.ts.map