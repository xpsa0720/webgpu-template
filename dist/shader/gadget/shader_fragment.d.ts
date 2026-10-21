import type { ShaderLightGadget } from "./shader_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderFragmentGadgetParams extends ShaderGadgetParams {
    device: GPUDevice;
    onLightChange?: () => void;
}
export declare class ShaderFragmentGadget extends ShaderGadget {
    device: GPUDevice;
    shaderLights: Record<number, ShaderLightGadget<any>>;
    private onLightChange?;
    constructor({ placeholder, device, onLightChange }: ShaderFragmentGadgetParams);
    private wrapLightChange;
    private initLight;
    updatePlaceholder(): void;
    private get lights();
    getFuntionCode(): string;
    getLightStructsUniforms(): string;
    getLightCode(): string;
    getCode(): string;
    getBindGroupEntry(device: GPUDevice): GPUBindGroupEntry[];
}
//# sourceMappingURL=shader_fragment.d.ts.map