import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector3 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
export interface MeshParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    geometry: Geometry;
}
export declare class Mesh {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate: Vector3;
    scale: Vector3;
    geometry: Geometry;
    constructor({ location, rotate, scale, geometry, render3DPass }: MeshParams);
}
//# sourceMappingURL=mesh.d.ts.map