import type { Render3DPass } from "../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../types/resource";
import type { Mat4x4 } from "../math/matrix";
import { Vector3 } from "../math/vector";
import type { Mesh } from "./mesh/mesh";
export interface MeshParams {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate?: Vector3;
    scale?: Vector3;
    meshs?: Mesh[];
}
export declare class Node {
    render3DPass: Render3DPass;
    location: Vector3;
    rotate: Vector3;
    scale: Vector3;
    worldMat: Mat4x4;
    normalMat: Mat4x4;
    parent: Node | null;
    children: Node[];
    matrixBuffer: WebGPUBuffer;
    meshs: Mesh[];
    constructor({ location, rotate, scale, render3DPass, meshs }: MeshParams);
    addChild(child: Node): void;
    updateWorld(): void;
}
//# sourceMappingURL=node.d.ts.map