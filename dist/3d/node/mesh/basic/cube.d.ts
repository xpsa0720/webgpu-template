import { Matrial } from "../matrial/matrial";
import { Mesh, type MeshParams } from "../mesh";
export interface CubeParams extends Omit<MeshParams, "geometry" | "matrial"> {
    width?: number;
    height?: number;
    depth?: number;
    matrial?: Matrial;
}
export declare class Cube extends Mesh {
    constructor({ location, rotate, scale, render3DPass, width, height, depth, matrial, }: CubeParams);
}
//# sourceMappingURL=cube.d.ts.map