import type { Render3DPass } from "../../../pass/render_3d_pass";
import { Vector3 } from "../../math/vector";
import { Matrial } from "../matrial/matrial";
import { Mesh } from "../mesh";
interface MeshParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    width?: number;
    height?: number;
    depth?: number;
    matrial?: Matrial;
}
export declare class Cube extends Mesh {
    constructor({ location, rotate, scale, render3DPass, width, height, depth, matrial, }: MeshParams);
}
export {};
//# sourceMappingURL=cube.d.ts.map