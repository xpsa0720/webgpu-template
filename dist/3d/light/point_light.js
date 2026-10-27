import { createLookAtViewMatrix } from "../../util/matrix";
import { toRadian } from "../../util/math";
import { Mat4x4 as Mat4x4Class } from "../math/matrix";
import { Vector3, Vector4 } from "../math/vector";
import { Light } from "./light";
export class PointLight extends Light {
    position;
    castShadow;
    pvMatrix;
    dirty = true;
    shadowNear = 0.1;
    shadowFar = 100;
    shadowFov = 120;
    constructor({ position = new Vector4(0, 0, 0, 1), castShadow, ...rest } = {}) {
        super(rest);
        this.position = position;
        this.castShadow = castShadow ?? false;
    }
    updateMatrix() {
        // position에서 아래(0,-1,0)를 바라보는 perspective 투영
        const pos = new Vector3(this.position.x, this.position.y, this.position.z);
        const target = new Vector3(pos.x, pos.y - 1, pos.z);
        const V = createLookAtViewMatrix(pos, target);
        const P = createPerspectiveProjectionMatrix(this.shadowFov, 1, // aspect 1:1 (정방형 shadow map)
        this.shadowNear, this.shadowFar);
        this.pvMatrix = V.multiply(P);
        this.dirty = false;
    }
}
/** fov(degree), aspect, near, far로 perspective 투영 행렬 생성 (WebGPU NDC: z 0..1) */
function createPerspectiveProjectionMatrix(fov, aspect, near, far) {
    const d = 1 / Math.tan(toRadian(fov) / 2);
    const X = d / aspect;
    const Y = d;
    const A = far / (near - far);
    const B = (far * near) / (near - far);
    return new Mat4x4Class([
        new Vector4(X, 0, 0, 0),
        new Vector4(0, Y, 0, 0),
        new Vector4(0, 0, A, -1),
        new Vector4(0, 0, B, 0),
    ]);
}
//# sourceMappingURL=point_light.js.map