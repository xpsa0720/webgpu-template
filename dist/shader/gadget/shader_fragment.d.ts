import { ShaderAmbientLightGadget, ShaderDirectionalLightGadget, ShaderPointLightGadget } from "./shader_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderFragmentGadgetParams extends ShaderGadgetParams {
}
export declare class ShaderFragmentGadget extends ShaderGadget {
    ambientLight: ShaderAmbientLightGadget;
    pointLight: ShaderPointLightGadget;
    directionalLight: ShaderDirectionalLightGadget;
    constructor({ placeholder }: ShaderFragmentGadgetParams);
    updatePlaceholder(): void;
    private get lights();
    getFuntionCode(): string;
    getLightStructsUniforms(): string;
    getLightCode(): string;
    getCode(): string;
}
//# sourceMappingURL=shader_fragment.d.ts.map