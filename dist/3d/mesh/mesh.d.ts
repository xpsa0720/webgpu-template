import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector3, Vector4 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
export interface MeshParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    geometry: Geometry;
    color?: Vector4;
}
export declare class Mesh {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate: Vector3;
    scale: Vector3;
    geometry: Geometry;
    color: Vector4;
    constructor({ location, rotate, scale, geometry, render3DPass, color }: MeshParams);
}
//# sourceMappingURL=mesh.d.ts.map