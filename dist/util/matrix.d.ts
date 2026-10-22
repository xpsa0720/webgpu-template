import { Mat3x3, Mat4x4 } from "../3d/math/matrix";
import { Vector3 } from "../3d/math/vector";
import type { Mesh } from "../3d/mesh/mesh";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
export declare function createFowardRotateMatrix(rotate: Vector3, inverse?: boolean): Mat3x3;
export declare function createViewMatrix(camera: Camera): Mat4x4;
export declare function createProjectionMatrix(camera: Camera, aspect: number): Mat4x4;
export declare function createMatrix(mesh: Mesh, camera: Camera, aspect: number, device: GPUDevice, buffer: WebGPUBuffer): WebGPUBuffer;
//# sourceMappingURL=matrix.d.ts.map