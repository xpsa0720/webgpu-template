import type { Render3DPass } from "../../../../pass/render_3d_pass";
import { Vector3 } from "../../../math/vector";
import { Matrial } from "../matrial/matrial";
import { Mesh } from "../mesh";
export interface SphereParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    radius?: number;
    matrial?: Matrial;
}
export declare class Sphere extends Mesh {
    radius: number;
    constructor({ location, rotate, scale, render3DPass, radius, matrial, }: SphereParams);
}
//# sourceMappingURL=sphere.d.ts.map