import type { WebGPUBuffer } from "../../types/resource";
import type { AmbientLight } from "../../3d/light/ambient_light";
import type { DirectionalLight } from "../../3d/light/directional_light";
import type { Light } from "../../3d/light/light";
import type { PointLight } from "../../3d/light/point_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShadowGadgetParams {
    shadowAddFunc: string;
    shadowAddCode: string;
}
export interface ShaderLightGadgetParams<T extends Light> extends ShaderGadgetParams {
    define: string;
    struct: string;
    group: number;
    binding: number;
    func: string;
    code: string;
    device: GPUDevice;
    lights?: T[];
    countPlaceholder: string;
    lengthPlaceholder: string;
    onLightChange?: () => void;
}
export declare const formatLightCount = 8;
export declare abstract class ShaderLightGadget<T extends Light> extends ShaderGadget {
    struct: string;
    define: string;
    group: number;
    structSize: number;
    func: string;
    device: GPUDevice;
    code: string;
    binding: number;
    gpuBuffer: WebGPUBuffer;
    countPlaceholder: string;
    lengthPlaceholder: string;
    private _lights;
    private onLightChange?;
    private _bufferCapacity;
    constructor({ struct, define, placeholder, binding, group, code, device, func, lights, countPlaceholder, lengthPlaceholder, onLightChange, }: ShaderLightGadgetParams<T>);
    private createBuffer;
    /** 버퍼 용량이 충분하면 writeBuffer만, 부족하면 새로 생성 */
    private ensureBuffer;
    get lights(): readonly T[];
    set lights(value: T[]);
    addLight(light: T): void;
    removeLight(index: number): T | undefined;
    private updateCount;
    updateLight(index: number): void;
    updateLightAll(): void;
    getCode(): string;
    getFunctionCode(): string;
    getStructUniformCode(): string;
}
export interface ShadowGadget {
    shadowPvMatrixDefine: string;
    shadowTextureDefine: string;
    shadowAddFunc: string;
    shadowAddCode: string;
    getShadowDefinesCode(): string;
    getShadowAddCode(): string;
    getShadowAddFuncCode(): string;
}
export declare class ShaderAmbientLightGadget extends ShaderLightGadget<AmbientLight> {
    constructor(params: ShaderLightGadgetParams<AmbientLight>);
}
export declare class ShaderPointLightGadget extends ShaderLightGadget<PointLight> implements ShadowGadget {
    shadowPvMatrixDefine: string;
    shadowTextureDefine: string;
    shadowAddFunc: string;
    shadowAddCode: string;
    constructor(params: ShaderLightGadgetParams<PointLight> & ShadowGadgetParams);
    getShadowDefinesCode(): string;
    getShadowAddCode(): string;
    getShadowAddFuncCode(): string;
}
export declare class ShaderDirectionalLightGadget extends ShaderLightGadget<DirectionalLight> implements ShadowGadget {
    shadowPvMatrixDefine: string;
    shadowTextureDefine: string;
    shadowAddFunc: string;
    shadowAddCode: string;
    constructor(params: ShaderLightGadgetParams<DirectionalLight> & ShadowGadgetParams);
    getShadowDefinesCode(): string;
    getShadowAddCode(): string;
    getShadowAddFuncCode(): string;
}
//# sourceMappingURL=shader_light.d.ts.map