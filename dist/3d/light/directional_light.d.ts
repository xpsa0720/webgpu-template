import type { Mat4x4 } from "../math/matrix";
import { Vector3, Vector4 } from "../math/vector";
import type { LightShadow } from "../shadow/lightShadow";
import { Light, type LightParams } from "./light";
export interface DirectionalLightParams extends LightParams {
    position?: Vector3;
    target?: Vector3;
    castShadow?: boolean;
}
export declare class DirectionalLight extends Light implements LightShadow {
    private _position;
    private _target;
    private _directional;
    dirty: boolean;
    castShadow: boolean;
    pvMatrix: Mat4x4;
    constructor({ position, target, castShadow, ...rest }?: DirectionalLightParams);
    shadowOrthoSize: number;
    shadowNear: number;
    shadowFar: number;
    updateMatrix(): void;
    private _observe;
    private calcDirectional;
    get position(): Vector3;
    set position(v: Vector3);
    get target(): Vector3;
    set target(v: Vector3);
    /** 셰이더에 넘길 방향 벡터 (position → target, 정규화됨) */
    get directional(): Vector4;
    /** dirty 플래그를 소비하고 변경 여부를 반환 */
    update(): boolean;
}
//# sourceMappingURL=directional_light.d.ts.map