import { Vector3 } from "../3d/math/vector";
import type { Mat4x4 } from "../3d/math/matrix";
import type { WebGPUBuffer } from "./resource";
export declare class Camera {
    private _position;
    private _upref;
    private _fov;
    private _near;
    private _far;
    private _target;
    private _rotate;
    dirty: boolean;
    cameraBuffer: WebGPUBuffer | null;
    vpBuffer: WebGPUBuffer | null;
    private _cameraPosData;
    private _vpData;
    private _lastAspect;
    /** 마지막 update()에서 계산된 VP 행렬 (프러스텀 컬링 등에 사용) */
    vpMatrix: Mat4x4 | null;
    constructor(position?: Vector3, target?: Vector3, fov?: number, near?: number, far?: number, upref?: Vector3, rotate?: Vector3);
    /** Vector3의 x,y,z 프로퍼티 변경을 감지하는 Proxy를 씌운다. */
    private _observe;
    get position(): Vector3;
    set position(v: Vector3);
    get target(): Vector3;
    set target(v: Vector3);
    /** target 지점을 바라보도록 rotate(pitch, yaw)를 설정한다. */
    lookAt(target: Vector3): void;
    get rotate(): Vector3;
    set rotate(v: Vector3);
    get upref(): Vector3;
    set upref(v: Vector3);
    update(device: GPUDevice, aspect: number): void;
    get fov(): number;
    set fov(v: number);
    get near(): number;
    set near(v: number);
    get far(): number;
    set far(v: number);
}
//# sourceMappingURL=camera.d.ts.map