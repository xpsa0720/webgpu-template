import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector3 } from "../math/vector";
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
    location: Vector3;
    rotate: Vector3;
    scale: Vector3;
    geometry: Geometry;
    matrial: Matrial;
    constructor({ location, rotate, scale, geometry, render3DPass, matrial }: MeshParams);
}
//# sourceMappingURL=mesh.d.ts.map