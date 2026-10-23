import type { Render3DPass } from "../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../types/resource";
import type { Mat4x4 } from "../math/matrix";
import { Vector3 } from "../math/vector";
import type { Geometry } from "./geometry/geometry";
import type { Matrial } from "./matrial/matrial";
export interface MeshParams {
    render3DPass: Render3DPass;
    instanceInfo?: InstanceMeshInfo[];
    geometry: Geometry;
}
interface InstanceMeshInfo {
    location: Vector3;
    rotate: Vector3;
    scale: Vector3;
    matrial: Matrial;
}
export declare class InstanceMesh {
    render3DPass: Render3DPass;
    count: number;
    renderCount: number;
    instanceInfo: InstanceMeshInfo[];
    geometry: Geometry;
    matrixBuffer: WebGPUBuffer;
    matrialBuffer: WebGPUBuffer;
    cachedBindGroup: GPUBindGroup | null;
    AabbCenter: Vector3;
    AabbRadius: number;
    private cachedMatrixData;
    private cachedMatrialData;
    private positions;
    private indices;
    private dirty;
    constructor({ instanceInfo, geometry, render3DPass }: MeshParams);
    markDirty(): void;
    private buildCache;
    frustumCull(PV: Mat4x4): void;
    writeAll(): void;
    private writeVisibleBuffers;
    update(): void;
    private createBuffer;
    static randomInstanceInfo(count: number, matrial: Matrial): InstanceMeshInfo[];
    private AABB;
}
export {};
//# sourceMappingURL=instance.d.ts.map