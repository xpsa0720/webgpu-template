import type { PointLight } from "../../../3d/light/point_light";
import { ShaderLightGadget, type ShaderLightGadgetParams, type ShadowGadget, type ShadowGadgetParams } from "./shader_light_gadget";
export declare class ShaderPointLightGadget extends ShaderLightGadget<PointLight> implements ShadowGadget {
    shadowPvMatrixDefine: string;
    shadowTextureDefine: string;
    shadowAddFunc: string;
    shadowAddCode: string;
    instanceShadowAddCode: string;
    instanceShadowAddFunc: string;
    constructor(params: ShaderLightGadgetParams<PointLight> & ShadowGadgetParams);
    get hasShadow(): boolean;
    private syncShadowPlaceholder;
    getCode(instance?: boolean): string;
    getFunctionCode(instance?: boolean): string;
    getShadowDefinesCode(): string;
    getShadowAddCode(): string;
    getShadowAddFuncCode(): string;
    getInstanceShadowAddCode(): string;
    getInstanceShadowAddFuncCode(): string;
}
//# sourceMappingURL=shader_point_light_gadget.d.ts.map