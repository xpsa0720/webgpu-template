import type { Vector3, Vector4 } from "../math/vector";
import { Light } from "./light";
export interface LightParams {
    position: Vector3;
    intensity?: number;
    color?: Vector4;
}
export declare class PointLight extends Light {
    position: Vector3;
    constructor({ position, intensity, color }: LightParams);
}
//# sourceMappingURL=point_light.d.ts.map