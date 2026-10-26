import { Vector4 } from "../math/vector";
import { Light, type LightParams } from "./light";
export interface DirectionalLightParams extends LightParams {
    directional?: Vector4;
}
export declare class DirectionalLight extends Light {
    directional: Vector4;
    constructor({ directional, ...rest }?: DirectionalLightParams);
}
//# sourceMappingURL=directional_light.d.ts.map