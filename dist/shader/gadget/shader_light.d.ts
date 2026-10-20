import type { Vector4 } from "../../3d/math/vector";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
export interface ShaderLightGadgetParams<T extends Light> extends ShaderGadgetParams {
    define: string;
    struct: string;
    group: number;
    binding: number;
    func: string;
    code: string;
    lights?: T[];
    countPlaceholder: string;
}
export declare class ShaderLightGadget<T extends Light> extends ShaderGadget {
    struct: string;
    define: string;
    group: number;
    func: string;
    code: string;
    binding: number;
    countPlaceholder: string;
    private _lights;
    constructor({ struct, define, placeholder, binding, group, code, func, lights, countPlaceholder, }: ShaderLightGadgetParams<T>);
    get lights(): readonly T[];
    set lights(value: T[]);
    addLight(light: T): void;
    removeLight(index: number): T | undefined;
    private updateCount;
    getCode(): string;
    getFunctionCode(): string;
    getStructUniformCode(): string;
}
interface Light {
    intensity: number;
    color: Vector4;
}
interface AmbientLight extends Light {
}
interface PointLight extends Light {
    position: Vector4;
}
interface DirectionalLight extends Light {
    directional: Vector4;
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
export {};
//# sourceMappingURL=shader_light.d.ts.map