import { createLookAtViewMatrix, createOrthographicProjectionMatrix } from "../../util/matrix";
import type { Mat4x4 } from "../math/matrix";
import { Vector3, Vector4 } from "../math/vector";
import type { LightShadow } from "../shadow/lightShadow";
import { Light, type LightParams } from "./light";

export interface DirectionalLightParams extends LightParams {
  position?: Vector3;
  target?: Vector3;
  castShadow?: boolean;
}

export class DirectionalLight extends Light implements LightShadow {
  private _position: Vector3;
  private _target: Vector3;
  private _directional: Vector4;
  dirty: boolean = true;

  castShadow: boolean;
  pvMatrix!: Mat4x4;

  constructor({
    position = new Vector3(0, 10, 0),
    target = new Vector3(0, 0, 0),
    castShadow,

    ...rest
  }: DirectionalLightParams = {}) {
    super(rest);
    this.castShadow =castShadow??false
    this._position = this._observe(position);
    this._target = this._observe(target);
    this._directional = this.calcDirectional();
  }

  shadowOrthoSize: number = 20;
  shadowNear: number = 0.1;
  shadowFar: number = 100;

  updateMatrix(){
    const V = createLookAtViewMatrix(this._position, this._target);
    const s = this.shadowOrthoSize;
    const P = createOrthographicProjectionMatrix(-s, s, -s, s, this.shadowNear, this.shadowFar);
    this.pvMatrix = V.multiply(P);
    this.dirty = false;
  }

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

  private calcDirectional(): Vector4 {
    const dx = this._target.x - this._position.x;
    const dy = this._target.y - this._position.y;
    const dz = this._target.z - this._position.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.0001) return new Vector4(0, -1, 0, 0);
    return new Vector4(dx / len, dy / len, dz / len, 0);
  }

  get position(): Vector3 {
    return this._position;
  }

  set position(v: Vector3) {
    this._position = this._observe(v);
    this.dirty = true;
  }

  get target(): Vector3 {
    return this._target;
  }

  set target(v: Vector3) {
    this._target = this._observe(v);
    this.dirty = true;
  }

  /** 셰이더에 넘길 방향 벡터 (position → target, 정규화됨) */
  get directional(): Vector4 {
    if (this.dirty) {
      this._directional = this.calcDirectional();
    }
    return this._directional;
  }

  /** dirty 플래그를 소비하고 변경 여부를 반환 */
  update(): boolean {
    if (!this.dirty) return false;
    this._directional = this.calcDirectional();
    this.dirty = false;
    return true;
  }

}
