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
    private _location;
    private _rotate;
    private _scale;
    worldMat: Mat4x4;
    normalMat: Mat4x4;
    dirty: boolean;
    parent: Node | null;
    children: Node[];
    matrixBuffer: WebGPUBuffer;
    meshs: Mesh[];
    constructor({ location, rotate, scale, render3DPass, meshs }: MeshParams);
    get location(): Vector3;
    set location(value: Vector3);
    get rotate(): Vector3;
    set rotate(value: Vector3);
    get scale(): Vector3;
    set scale(value: Vector3);
    private watch;
    addChild(child: Node): void;
    /**
     * 월드 / normal 행렬을 다시 계산한다 (자식까지 재귀).
     * 렌더러는 dirty일 때만 호출한다. 값을 바꾼 직후 월드 행렬이 바로 필요하면 직접 호출해도 된다.
     */
    updateWorld(): void;
}
//# sourceMappingURL=node.d.ts.map