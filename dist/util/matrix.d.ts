import { Mat3x3, Mat4x4 } from "../3d/math/matrix";
import { Vector3 } from "../3d/math/vector";
import type { Mesh } from "../3d/node/mesh/mesh";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
export declare function quaternionToEuler(q: readonly number[]): Vector3;
export declare function createFowardRotateMatrix(rotate: Vector3, inverse?: boolean): Mat3x3;
type Transform = Pick<Mesh, "location" | "rotate" | "scale">;
export declare function createModelMatrix(mesh: Transform): Mat4x4;
export declare function createViewMatrix(camera: Camera): Mat4x4;
export declare function createLookAtMatrix(eye: Vector3, forward: Vector3, upref: Vector3): Mat4x4;
export declare function createCameraViewMatrix(camera: Camera): Mat4x4;
/** 시선 방향 → { yaw, pitch } (createCameraViewMatrix의 역변환, 라디안) */
export declare function directionToYawPitch(direction: Vector3): {
    yaw: number;
    pitch: number;
};
export declare function createLookAtViewMatrix(position: Vector3, target: Vector3): Mat4x4;
export declare function createProjectionMatrix(camera: Camera, aspect: number): Mat4x4;
export declare function createOrthographicProjectionMatrix(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4x4;
export declare function createViewProjectionMatrix(camera: Camera, aspect: number): Mat4x4;
export declare function createNormalMatrix(transform: Transform): Mat4x4;
export declare function createMatrixData(transform: Transform, parentMat?: {
    parentWorldMat: Mat4x4;
    parentNormalMat: Mat4x4;
}): Float32Array<ArrayBuffer>;
export declare function createModelMatrixData(transform: Transform): Float32Array<ArrayBuffer>;
export declare function createMatrix(mesh: Mesh, device: GPUDevice, buffer: WebGPUBuffer, parentMat?: {
    parentWorldMat: Mat4x4;
    parentNormalMat: Mat4x4;
}): WebGPUBuffer;
export {};
//# sourceMappingURL=matrix.d.ts.map