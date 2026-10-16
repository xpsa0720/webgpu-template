import type { Mat4x4 } from "./matrix";
export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    dot(other: Vector3): number;
    copy(): Vector3;
    subtract(A: Vector3): this;
}
export declare class Vector4 extends Vector3 {
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    dot(other: Vector4): number;
    multiplyMat4(mat: Mat4x4): void;
    private getElement;
    copy(): Vector4;
    subtract(A: Vector4): this;
}
//# sourceMappingURL=vector.d.ts.map