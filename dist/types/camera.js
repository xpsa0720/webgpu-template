import { Vector3, Vector4 } from "../3d/math/vector";
export class Camera {
    position;
    upref;
    fov;
    near;
    far;
    target;
    rotate;
    constructor(position = new Vector3(), target = new Vector3(), fov = 60, near = 0.1, far = 100, upref = new Vector3(0, 1, 0), rotate = new Vector3(0, 0, 0)) {
        this.position = position;
        this.target = target;
        this.rotate = rotate;
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.upref = upref;
    }
}
//# sourceMappingURL=camera.js.map