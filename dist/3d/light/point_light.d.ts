import type { Mat4x4 } from "../math/matrix";
import { Vector4 } from "../math/vector";
import type { LightShadow } from "../shadow/lightShadow";
import { Light, type LightParams } from "./light";
export interface PointLightParams extends LightParams {
    position?: Vector4;
    castShadow?: boolean;
}
export declare class PointLight extends Light implements LightShadow {
    position: Vector4;
    castShadow: boolean;
    pvMatrix: Mat4x4;
    dirty: boolean;
    shadowNear: number;
    shadowFar: number;
    shadowFov: number;
    constructor({ position, castShadow, ...rest }?: PointLightParams);
    updateMatrix(): void;
}
//# sourceMappingURL=point_light.d.ts.map