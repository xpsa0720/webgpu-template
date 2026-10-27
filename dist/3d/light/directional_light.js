import { createLookAtViewMatrix, createOrthographicProjectionMatrix } from "../../util/matrix";
import { Vector3, Vector4 } from "../math/vector";
import { Light } from "./light";
export class DirectionalLight extends Light {
    _position;
    _target;
    _directional;
    dirty = true;
    castShadow;
    pvMatrix;
    constructor({ position = new Vector3(0, 10, 0), target = new Vector3(0, 0, 0), castShadow, ...rest } = {}) {
        super(rest);
        this.castShadow = castShadow ?? false;
        this._position = this._observe(position);
        this._target = this._observe(target);
        this._directional = this.calcDirectional();
    }
    shadowOrthoSize = 20;
    shadowNear = 0.1;
    shadowFar = 100;
    updateMatrix() {
        const V = createLookAtViewMatrix(this._position, this._target);
        const s = this.shadowOrthoSize;
        const P = createOrthographicProjectionMatrix(-s, s, -s, s, this.shadowNear, this.shadowFar);
        this.pvMatrix = V.multiply(P);
        this.dirty = false;
    }
    _observe(vec) {
        return new Proxy(vec, {
            set: (obj, prop, value) => {
                obj[prop] = value;
                if (prop === "x" || prop === "y" || prop === "z") {
                    this.dirty = true;
                }
                return true;
            },
        });
    }
    calcDirectional() {
        const dx = this._target.x - this._position.x;
        const dy = this._target.y - this._position.y;
        const dz = this._target.z - this._position.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len < 0.0001)
            return new Vector4(0, -1, 0, 0);
        return new Vector4(dx / len, dy / len, dz / len, 0);
    }
    get position() {
        return this._position;
    }
    set position(v) {
        this._position = this._observe(v);
        this.dirty = true;
    }
    get target() {
        return this._target;
    }
    set target(v) {
        this._target = this._observe(v);
        this.dirty = true;
    }
    /** 셰이더에 넘길 방향 벡터 (position → target, 정규화됨) */
    get directional() {
        if (this.dirty) {
            this._directional = this.calcDirectional();
        }
        return this._directional;
    }
    /** dirty 플래그를 소비하고 변경 여부를 반환 */
    update() {
        if (!this.dirty)
            return false;
        this._directional = this.calcDirectional();
        this.dirty = false;
        return true;
    }
}
//# sourceMappingURL=directional_light.js.map