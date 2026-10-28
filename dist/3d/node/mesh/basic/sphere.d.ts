import { Matrial } from "../matrial/matrial";
import { Mesh, type MeshParams } from "../mesh";
export interface SphereParams extends Omit<MeshParams, "geometry" | "matrial"> {
    radius?: number;
    matrial?: Matrial;
}
export declare class Sphere extends Mesh {
    radius: number;
    constructor({ location, rotate, scale, render3DPass, radius, matrial, }: SphereParams);
}
//# sourceMappingURL=sphere.d.ts.map