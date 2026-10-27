import { Vector3, Vector4 } from "../3d/math/vector";
import type { Mat4x4 } from "../3d/math/matrix";
import { createViewProjectionMatrix, directionToYawPitch } from "../util/matrix";
import type { WebGPUBuffer } from "./resource";

export class Camera {
  private _position: Vector3;
  private _upref: Vector3;
  private _fov: number;
  private _near: number;
  private _far: number;
  private _target: Vector3;
  private _rotate: Vector3;

  dirty = true;
  cameraBuffer: WebGPUBuffer | null = null;
  vpBuffer: WebGPUBuffer | null = null;

  private _cameraPosData = new Float32Array(4);
  private _vpData = new Float32Array(16);
  private _lastAspect = -1;
  /** 마지막 update()에서 계산된 VP 행렬 (프러스텀 컬링 등에 사용) */
  vpMatrix: Mat4x4 | null = null;

  constructor(
    position = new Vector3(),
    target = new Vector3(),
    fov = 60,
    near = 0.1,
    far = 100,
    upref = new Vector3(0, 1, 0),
    rotate?: Vector3, // (pitch, yaw, roll) 절대 각도. 생략하면 target을 바라보도록 계산
  ) {
    this._fov = fov;
    this._near = near;
    this._far = far;
    this._position = this._observe(position);
    this._target = this._observe(target);
    this._rotate = this._observe(rotate ?? new Vector3(0, 0, 0));
    if (!rotate) this.lookAt(target);
    this._upref = this._observe(upref);

  }

  /** Vector3의 x,y,z 프로퍼티 변경을 감지하는 Proxy를 씌운다. */
  private _observe(vec: Vector3): Vector3 {
    return new Proxy(vec, {
      set: (obj, prop, value) => {
        (obj as any)[prop] = value;
        if (prop === "x" || prop === "y" || prop === "z") {
          this.dirty = true;
        }
        return true;
      },
    });
  }

  

  // --- position ---
  get position(): Vector3 {
    return this._position;
  }
  set position(v: Vector3) {
    this._position = this._observe(v);
    this.dirty = true;
  }

  // --- target ---
  get target(): Vector3 {
    return this._target;
  }
  // target을 통째로 바꾸면 그 지점을 바라보도록 rotate를 다시 계산한다.
  // (x/y/z만 바꾸는 건 시선에 영향 없음 — 시선은 rotate(yaw/pitch)로만 결정)
  set target(v: Vector3) {
    this.lookAt(v);
  }

  /** target 지점을 바라보도록 rotate(pitch, yaw)를 설정한다. */
  lookAt(target: Vector3) {
    this._target = this._observe(target);
    const { yaw, pitch } = directionToYawPitch(
      target.copy().subtract(this._position),
    );
    this._rotate.x = pitch;
    this._rotate.y = yaw;
    this._rotate.z = 0;
    this.dirty = true;
  }

  // --- rotate ---
  get rotate(): Vector3 {
    return this._rotate;
  }
  set rotate(v: Vector3) {
    this._rotate = this._observe(v);
    this.dirty = true;
  }

  get upref(): Vector3 {
    return this._upref;
  }
  set upref(v: Vector3) {
    this._upref = this._observe(v);
    this.dirty = true;
  }

  update(device: GPUDevice, aspect: number) {
    if (aspect !== this._lastAspect) {
      this._lastAspect = aspect;
      this.dirty = true;
    }
    if (!this.dirty) return;

    if (this.cameraBuffer) {
      this._cameraPosData[0] = this._position.x;
      this._cameraPosData[1] = this._position.y;
      this._cameraPosData[2] = this._position.z;
      this._cameraPosData[3] = 1;
      device.queue.writeBuffer(this.cameraBuffer.buffer, 0, this._cameraPosData);
    }

    if (this.vpBuffer) {
      const vp = createViewProjectionMatrix(this, aspect);
      this._vpData.set(vp.getArrayData());
      device.queue.writeBuffer(this.vpBuffer.buffer, 0, this._vpData);
      this.vpMatrix = vp;
    }

    this.dirty = false;
  }

  // --- fov ---
  get fov(): number {
    return this._fov;
  }
  set fov(v: number) {
    this._fov = v;
    this.dirty = true;
  }

  // --- near ---
  get near(): number {
    return this._near;
  }
  set near(v: number) {
    this._near = v;
    this.dirty = true;
  }

  // --- far ---
  get far(): number {
    return this._far;
  }
  set far(v: number) {
    this._far = v;
    this.dirty = true;
  }
}
