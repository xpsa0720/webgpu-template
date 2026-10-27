import { Mat3x3, Mat4x4 } from "../3d/math/matrix";
import { Vector3, Vector4 } from "../3d/math/vector";
import { normalize, toRadian } from "./math";
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
export function quaternionToEuler(q) {
    const [x, y, z, w] = q;
    // 회전 행렬 성분 (mRC = R행 C열)
    const m11 = 1 - 2 * (y * y + z * z);
    const m12 = 2 * (x * y - z * w);
    const m13 = 2 * (x * z + y * w);
    const m22 = 1 - 2 * (x * x + z * z);
    const m23 = 2 * (y * z - x * w);
    const m32 = 2 * (y * z + x * w);
    const m33 = 1 - 2 * (x * x + y * y);
    const ry = Math.asin(Math.max(-1, Math.min(1, m13)));
    if (Math.abs(m13) < 0.9999999) {
        return new Vector3(Math.atan2(-m23, m33), ry, Math.atan2(-m12, m11));
    }
    // 짐벌 락 (y = ±90°): z를 0으로 두고 x에 몰아줌
    return new Vector3(Math.atan2(m32, m22), ry, 0);
}
export function createFowardRotateMatrix(rotate, inverse = false) {
    const rotate_X = rotate.x * (inverse ? -1 : 1);
    const rotate_Y = rotate.y * (inverse ? -1 : 1);
    //   const rotate_Z = rotate.z * (inverse ? -1 : 1);
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
    //   const Z_Matrix = new Mat3x3([
    //     new Vector3(Math.cos(rotate_Z), Math.sin(rotate_Z), 0),
    //     new Vector3(-Math.sin(rotate_Z), Math.cos(rotate_Z), 0),
    //     new Vector3(0, 0, 1),
    //   ]);
    const YX = X_Matrix.multiply(Y_Matrix);
    //   const ZYX = Z_Matrix.multiply(YX);
    return YX;
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
export function createModelMatrix(mesh) {
    const S = createScaleMatrix(mesh.scale);
    const R = createRotateMatrix(mesh.rotate);
    const T = createTranslateMatrix(mesh.location);
    // S.multiply(R).multiply(T) → T * R * S (읽는 순서 = 적용 순서)
    const TRS = S.multiply(R).multiply(T);
    return TRS;
}
export function createViewMatrix(camera) {
    const rotMat = createFowardRotateMatrix(camera.rotate);
    const rawF = normalize(camera.target.copy().subtract(camera.position));
    const F = normalize(rotMat.multiplyVec3(rawF));
    return createLookAtMatrix(camera.position, F, camera.upref);
}
export function createLookAtMatrix(eye, forward, upref) {
    const F = normalize(forward);
    let up = upref;
    if (Math.abs(F.dot(up)) > 0.999) {
        up = new Vector3(0, 0, 1);
    }
    const R = normalize(F.crossProduct(up));
    const U = R.crossProduct(F);
    return viewMatrixFromBasis(R, U, F, eye);
}
export function createCameraViewMatrix(camera) {
    const yaw = camera.rotate.y;
    const pitch = camera.rotate.x;
    const F = new Vector3(-Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.cos(yaw));
    const R = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const U = R.crossProduct(F);
    return viewMatrixFromBasis(R, U, F, camera.position);
}
/** 시선 방향 → { yaw, pitch } (createCameraViewMatrix의 역변환, 라디안) */
export function directionToYawPitch(direction) {
    const d = normalize(direction);
    return {
        yaw: Math.atan2(-d.x, -d.z),
        pitch: Math.asin(Math.max(-1, Math.min(1, d.y))),
    };
}
// View 행렬은 -F를 z축으로 사용 (카메라 앞쪽 = -z)
function viewMatrixFromBasis(R, U, F, C) {
    return new Mat4x4([
        new Vector4(R.x, U.x, -F.x, 0),
        new Vector4(R.y, U.y, -F.y, 0),
        new Vector4(R.z, U.z, -F.z, 0),
        new Vector4(-R.dot(C), -U.dot(C), F.dot(C), 1),
    ]);
}
export function createLookAtViewMatrix(position, target) {
    let upref = new Vector3(0, 1, 0);
    const F = normalize(target.copy().subtract(position));
    if (Math.abs(F.dot(upref)) > 0.999) {
        upref = new Vector3(0, 0, 1);
    }
    const R = normalize(F.crossProduct(upref));
    const U = R.crossProduct(F);
    const L = position;
    // View 행렬은 -F를 z축으로 사용 (카메라 앞쪽 = -z)
    return new Mat4x4([
        new Vector4(R.x, U.x, -F.x, 0),
        new Vector4(R.y, U.y, -F.y, 0),
        new Vector4(R.z, U.z, -F.z, 0),
        new Vector4(-R.dot(L), -U.dot(L), F.dot(L), 1),
    ]);
}
export function createProjectionMatrix(camera, aspect) {
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
export function createOrthographicProjectionMatrix(left, right, bottom, top, near, far) {
    const lr = 1 / (right - left);
    const bt = 1 / (top - bottom);
    const nf = 1 / (far - near);
    return new Mat4x4([
        new Vector4(2 * lr, 0, 0, 0),
        new Vector4(0, 2 * bt, 0, 0),
        new Vector4(0, 0, -nf, 0),
        new Vector4(-(right + left) * lr, -(top + bottom) * bt, -near * nf, 1),
    ]);
}
export function createViewProjectionMatrix(camera, aspect) {
    return createCameraViewMatrix(camera).multiply(createProjectionMatrix(camera, aspect));
}
export function createNormalMatrix(transform) {
    const S_inv = createScaleMatrix(transform.scale, true);
    const R = createRotateMatrix(transform.rotate);
    const n = S_inv.multiply(R);
    return n;
}
export function createMatrixData(transform, parentMat) {
    const local = createModelMatrix(transform);
    const M = parentMat?.parentWorldMat
        ? local.multiply(parentMat.parentWorldMat)
        : local;
    const n = createNormalMatrix(transform);
    const NormalMatrix = parentMat?.parentNormalMat
        ? n.multiply(parentMat.parentNormalMat)
        : n;
    // Matrixs struct 순서: normalMatrix, modelMatrix (mat4x4 × 2 = 32 floats)
    // VP는 별도 uniform → 셰이더에서 vpMatrix * modelMatrix로 MVP 조립
    const data = new Float32Array(32);
    data.set([
        ...NormalMatrix.getArrayData(),
        ...M.getArrayData(),
    ], 0);
    return data;
}
export function createModelMatrixData(transform) {
    const M = createModelMatrix(transform);
    const S_inv = createScaleMatrix(transform.scale, true);
    const R = createRotateMatrix(transform.rotate);
    const NormalMatrix = S_inv.multiply(R);
    const data = new Float32Array(32);
    data.set([...M.getArrayData(), ...NormalMatrix.getArrayData()], 0);
    return data;
}
export function createMatrix(mesh, device, buffer, parentMat) {
    const data = createMatrixData(mesh, parentMat);
    device.queue.writeBuffer(buffer.buffer, 0, data);
    return buffer;
}
//# sourceMappingURL=matrix.js.map