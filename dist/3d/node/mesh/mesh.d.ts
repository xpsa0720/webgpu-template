import type { Render3DPass } from "../../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../../types/resource";
import { Vector3 } from "../../math/vector";
import { Geometry } from "./geometry/geometry";
import type { Matrial } from "./matrial/matrial";
export interface MeshParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    geometry: Geometry;
    matrial: Matrial;
}
export declare class Mesh {
    render3DPass: Render3DPass;
    private _location;
    private _rotate;
    private _scale;
    geometry: Geometry;
    matrial: Matrial;
    matrixBuffer: WebGPUBuffer;
    matrialBuffer: WebGPUBuffer;
    cachedBindGroup: GPUBindGroup | null;
    AabbCenter: Vector3;
    AabbRadius: number;
    dirty: boolean;
    castShadow: boolean;
    receiveShadow: boolean;
    constructor({ location, rotate, scale, geometry, render3DPass, matrial, }: MeshParams);
    get location(): Vector3;
    set location(value: Vector3);
    get rotate(): Vector3;
    set rotate(value: Vector3);
    get scale(): Vector3;
    set scale(value: Vector3);
    private watch;
    private AABB;
}
//# sourceMappingURL=mesh.d.ts.map