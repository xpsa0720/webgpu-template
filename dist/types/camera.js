import { Vector3, Vector4 } from "../3d/math/vector";
import { createViewProjectionMatrix } from "../util/matrix";
export class Camera {
    _position;
    _upref;
    _fov;
    _near;
    _far;
    _target;
    _rotate;
    dirty = true;
    cameraBuffer = null;
    vpBuffer = null;
    _cameraPosData = new Float32Array(4);
    _vpData = new Float32Array(16);
    _lastAspect = -1;
    /** 마지막 update()에서 계산된 VP 행렬 (프러스텀 컬링 등에 사용) */
    vpMatrix = null;
    constructor(position = new Vector3(), target = new Vector3(), fov = 60, near = 0.1, far = 100, upref = new Vector3(0, 1, 0), rotate = new Vector3(0, 0, 0)) {
        this._fov = fov;
        this._near = near;
        this._far = far;
        this._position = this._observe(position);
        this._target = this._observe(target);
        this._rotate = this._observe(rotate);
        this._upref = this._observe(upref);
    }
    /** Vector3의 x,y,z 프로퍼티 변경을 감지하는 Proxy를 씌운다. */
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
    // --- position ---
    get position() {
        return this._position;
    }
    set position(v) {
        this._position = this._observe(v);
        this.dirty = true;
    }
    // --- target ---
    get target() {
        return this._target;
    }
    set target(v) {
        this._target = this._observe(v);
        this.dirty = true;
    }
    // --- rotate ---
    get rotate() {
        return this._rotate;
    }
    set rotate(v) {
        this._rotate = this._observe(v);
        this.dirty = true;
    }
    get upref() {
        return this._upref;
    }
    set upref(v) {
        this._upref = this._observe(v);
        this.dirty = true;
    }
    update(device, aspect) {
        if (aspect !== this._lastAspect) {
            this._lastAspect = aspect;
            this.dirty = true;
        }
        if (!this.dirty)
            return;
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
    get fov() {
        return this._fov;
    }
    set fov(v) {
        this._fov = v;
        this.dirty = true;
    }
    // --- near ---
    get near() {
        return this._near;
    }
    set near(v) {
        this._near = v;
        this.dirty = true;
    }
    // --- far ---
    get far() {
        return this._far;
    }
    set far(v) {
        this._far = v;
        this.dirty = true;
    }
}
//# sourceMappingURL=camera.js.map