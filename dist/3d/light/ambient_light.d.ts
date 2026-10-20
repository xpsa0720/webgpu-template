import { Vector4 } from "../math/vector";
import { Light } from "./light";
export interface AmbientLightParams {
    intensity?: number;
    color?: Vector4;
}
export declare class AmbientLight extends Light {
    constructor({ intensity, color }: AmbientLightParams);
}
//# sourceMappingURL=ambient_light.d.ts.map