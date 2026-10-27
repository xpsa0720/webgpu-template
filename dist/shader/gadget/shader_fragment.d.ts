import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderFragmentGadgetParams extends ShaderGadgetParams {
    device: GPUDevice;
    code?: string;
}
export declare class ShaderFragmentGadget extends ShaderGadget {
    device: GPUDevice;
    code: string;
    constructor({ placeholder, device, code }: ShaderFragmentGadgetParams);
    buildCode(arg: {
        lightStructsUniforms: string;
        lightCode: string;
        funtionCode: string;
        shadowDefinesCode: string;
    }): string;
}
//# sourceMappingURL=shader_fragment.d.ts.map