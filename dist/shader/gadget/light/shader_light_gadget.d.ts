import type { WebGPUBuffer } from "../../../types/resource";
import type { Light } from "../../../3d/light/light";
import { ShaderGadget, type ShaderGadgetParams } from "../shader_gadget";
export interface ShadowGadgetParams {
    shadowAddFunc: string;
    shadowAddCode: string;
    instanceShadowAddCode: string;
    instanceShadowAddFunc: string;
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
    private _lights;
    private onLightChange?;
    private _bufferCapacity;
    constructor({ struct, define, placeholder, binding, group, code, device, func, lights, countPlaceholder, onLightChange, }: ShaderLightGadgetParams<T>);
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
    instanceShadowAddCode: string;
    instanceShadowAddFunc: string;
    readonly hasShadow: boolean;
    getShadowDefinesCode(): string;
    getShadowAddCode(): string;
    getShadowAddFuncCode(): string;
    getInstanceShadowAddCode(): string;
    getInstanceShadowAddFuncCode(): string;
}
//# sourceMappingURL=shader_light_gadget.d.ts.map