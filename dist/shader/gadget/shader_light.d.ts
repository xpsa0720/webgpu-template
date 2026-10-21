import { Vector4 } from "../../3d/math/vector";
import type { WebGPUBuffer } from "../../types/resource";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
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
    constructor({ struct, define, placeholder, binding, group, code, device, func, lights, countPlaceholder, onLightChange, }: ShaderLightGadgetParams<T>);
    private createBuffer;
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
export interface LightParams {
    intensity?: number;
    color?: Vector4;
}
export declare class Light {
    intensity: number;
    color: Vector4;
    constructor({ intensity, color }?: LightParams);
}
export interface AmbientLightParams extends LightParams {
}
export declare class AmbientLight extends Light {
    constructor(params?: AmbientLightParams);
}
export interface PointLightParams extends LightParams {
    position?: Vector4;
}
export declare class PointLight extends Light {
    position: Vector4;
    constructor({ position, ...rest }?: PointLightParams);
}
export interface DirectionalLightParams extends LightParams {
    directional?: Vector4;
}
export declare class DirectionalLight extends Light {
    directional: Vector4;
    constructor({ directional, ...rest }?: DirectionalLightParams);
}
export declare class ShaderAmbientLightGadget extends ShaderLightGadget<AmbientLight> {
    constructor(params: ShaderLightGadgetParams<AmbientLight>);
}
export declare class ShaderPointLightGadget extends ShaderLightGadget<PointLight> {
    constructor(params: ShaderLightGadgetParams<PointLight>);
}
export declare class ShaderDirectionalLightGadget extends ShaderLightGadget<DirectionalLight> {
    constructor(params: ShaderLightGadgetParams<DirectionalLight>);
}
//# sourceMappingURL=shader_light.d.ts.map