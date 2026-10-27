import { Vector4 } from "../math/vector";
export interface LightParams {
    intensity?: number;
    color?: Vector4;
}
export declare class Light {
    intensity: number;
    color: Vector4;
    constructor({ intensity, color, }?: LightParams);
}
//# sourceMappingURL=light.d.ts.map