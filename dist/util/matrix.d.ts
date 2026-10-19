import { Mat3x3 } from "../3d/math/matrix";
import { Vector3 } from "../3d/math/vector";
import type { Mesh } from "../3d/mesh/mesh";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
export declare function createFowardRotateMatrix(rotate: Vector3, inverse?: boolean): Mat3x3;
export declare function createMatrix(mesh: Mesh, camera: Camera, aspect: number, device: GPUDevice): WebGPUBuffer;
//# sourceMappingURL=matrix.d.ts.map