import type { Render3DPass } from "../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../types/resource";
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
    instanceInfo: InstanceMeshInfo[];
    geometry: Geometry;
    matrixBuffer: WebGPUBuffer;
    matrialBuffer: WebGPUBuffer;
    private dirty;
    AabbCenter: Vector3;
    AabbRadius: number;
    constructor({ instanceInfo, geometry, render3DPass, }: MeshParams);
    markDirty(): void;
    update(): void;
    private writeBuffers;
    private createBuffer;
    static randomInstanceInfo(count: number, matrial: Matrial): InstanceMeshInfo[];
    private AABB;
}
export {};
//# sourceMappingURL=instance.d.ts.map