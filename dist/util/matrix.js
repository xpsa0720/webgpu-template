import { Mat3x3, Mat4x4 } from "../3d/math/matrix";
import { Vector3, Vector4 } from "../3d/math/vector";
import { crossProduct, normalize, toRadian } from "./math";
function createRotateMatrix(rotate, inverse = false) {
    const rotate_X = rotate.x * (inverse ? -1 : 1);
    const rotate_Y = rotate.y * (inverse ? -1 : 1);
    const rotate_Z = rotate.z * (inverse ? -1 : 1);
    const X_Matrix = new Mat4x4([
        new Vector4(1, 0, 0, 0),
        new Vector4(0, Math.cos(rotate_X), Math.sin(rotate_X), 0),
        new Vector4(0, -Math.sin(rotate_X), Math.cos(rotate_X), 0),
        new Vector4(0, 0, 0, 1),
    ]);
    const Y_Matrix = new Mat4x4([
        new Vector4(Math.cos(rotate_Y), 0, -Math.sin(rotate_Y), 0),
        new Vector4(0, 1, 0, 0),
        new Vector4(Math.sin(rotate_Y), 0, Math.cos(rotate_Y), 0),
        new Vector4(0, 0, 0, 1),
    ]);
    const Z_Matrix = new Mat4x4([
        new Vector4(Math.cos(rotate_Z), Math.sin(rotate_Z), 0, 0),
        new Vector4(-Math.sin(rotate_Z), Math.cos(rotate_Z), 0, 0),
        new Vector4(0, 0, 1, 0),
        new Vector4(0, 0, 0, 1),
    ]);
    const XY = Y_Matrix.multiply(X_Matrix);
    const XYZ = Z_Matrix.multiply(XY);
    return XYZ;
}
export function createFowardRotateMatrix(rotate, inverse = false) {
    const rotate_X = rotate.x * (inverse ? -1 : 1);
    const rotate_Y = rotate.y * (inverse ? -1 : 1);
    const rotate_Z = rotate.z * (inverse ? -1 : 1);
    const X_Matrix = new Mat3x3([
        new Vector3(1, 0, 0),
        new Vector3(0, Math.cos(rotate_X), Math.sin(rotate_X)),
        new Vector3(0, -Math.sin(rotate_X), Math.cos(rotate_X)),
    ]);
    const Y_Matrix = new Mat3x3([
        new Vector3(Math.cos(rotate_Y), 0, -Math.sin(rotate_Y)),
        new Vector3(0, 1, 0),
        new Vector3(Math.sin(rotate_Y), 0, Math.cos(rotate_Y)),
    ]);
    const Z_Matrix = new Mat3x3([
        new Vector3(Math.cos(rotate_Z), Math.sin(rotate_Z), 0),
        new Vector3(-Math.sin(rotate_Z), Math.cos(rotate_Z), 0),
        new Vector3(0, 0, 1),
    ]);
    const XY = Y_Matrix.multiply(X_Matrix);
    const XYZ = Z_Matrix.multiply(XY);
    return XYZ;
}
function createTranslateMatrix(translate, inverse = false) {
    const X = translate.x * (inverse ? -1 : 1);
    const Y = translate.y * (inverse ? -1 : 1);
    const Z = translate.z * (inverse ? -1 : 1);
    const Matrix = new Mat4x4([
        new Vector4(1, 0, 0, 0),
        new Vector4(0, 1, 0, 0),
        new Vector4(0, 0, 1, 0),
        new Vector4(X, Y, Z, 1),
    ]);
    return Matrix;
}
function createScaleMatrix(scale, inverse = false) {
    const X = inverse ? 1 / scale.x : scale.x;
    const Y = inverse ? 1 / scale.y : scale.y;
    const Z = inverse ? 1 / scale.z : scale.z;
    const Matrix = new Mat4x4([
        new Vector4(X, 0, 0, 0),
        new Vector4(0, Y, 0, 0),
        new Vector4(0, 0, Z, 0),
        new Vector4(0, 0, 0, 1),
    ]);
    return Matrix;
}
function createModelMatrix(mesh) {
    const S = createScaleMatrix(mesh.scale);
    const R = createRotateMatrix(mesh.rotate);
    const T = createTranslateMatrix(mesh.location);
    // S.multiply(R).multiply(T) → T * R * S (읽는 순서 = 적용 순서)
    const TRS = S.multiply(R).multiply(T);
    return TRS;
}
function createViewMatrix(camera) {
    // forward 방향에 카메라 회전 적용
    const rotMat = createFowardRotateMatrix(camera.rotate);
    const rawF = normalize(camera.target.copy().subtract(camera.position));
    const F = normalize(rotMat.multiplyVec3(rawF));
    const R = normalize(crossProduct(F, camera.upref));
    const U = crossProduct(R, F);
    const C = camera.position;
    // View 행렬은 -F를 z축으로 사용 (카메라 앞쪽 = -z)
    const V = new Mat4x4([
        new Vector4(R.x, U.x, -F.x, 0),
        new Vector4(R.y, U.y, -F.y, 0),
        new Vector4(R.z, U.z, -F.z, 0),
        new Vector4(-R.dot(C), -U.dot(C), F.dot(C), 1),
    ]);
    return V;
}
function createProjectionMatrix(camera, aspect) {
    const f = camera.far;
    const n = camera.near;
    const d = 1 / Math.tan(toRadian(camera.fov) / 2);
    const X = d / aspect;
    const Y = d;
    const A = f / (n - f);
    const B = (f * n) / (n - f);
    const V = new Mat4x4([
        new Vector4(X, 0, 0, 0),
        new Vector4(0, Y, 0, 0),
        new Vector4(0, 0, A, -1),
        new Vector4(0, 0, B, 0),
    ]);
    return V;
}
export function createMvpMatrix(mesh, camera, aspect, device) {
    const M = createModelMatrix(mesh);
    const V = createViewMatrix(camera);
    const P = createProjectionMatrix(camera, aspect);
    // M.multiply(V).multiply(P) → P * V * M (읽는 순서 = 적용 순서)
    const MVP = M.multiply(V).multiply(P);
    // mat4x4(64bytes)
    const data = new Float32Array(16);
    data.set(MVP.getArrayData(), 0);
    const buffer = {
        buffer: device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        }),
    };
    device.queue.writeBuffer(buffer.buffer, 0, data);
    return buffer;
}
//# sourceMappingURL=matrix.js.map