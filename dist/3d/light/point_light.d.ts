import { Vector4 } from "../math/vector";
import { Light, type LightParams } from "./light";
export interface PointLightParams extends LightParams {
    position?: Vector4;
}
export declare class PointLight extends Light {
    position: Vector4;
    constructor({ position, ...rest }?: PointLightParams);
}
//# sourceMappingURL=point_light.d.ts.map