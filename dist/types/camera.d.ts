import { Vector3 } from "../3d/math/vector";
export declare class Camera {
    position: Vector3;
    upref: Vector3;
    fov: number;
    near: number;
    far: number;
    target: Vector3;
    rotate: Vector3;
    constructor(position?: Vector3, target?: Vector3, fov?: number, near?: number, far?: number, upref?: Vector3, rotate?: Vector3);
}
//# sourceMappingURL=camera.d.ts.map