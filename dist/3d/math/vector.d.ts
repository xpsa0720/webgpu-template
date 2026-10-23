import type { Mat4x4 } from "./matrix";
export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    dot(other: Vector3): number;
    crossProduct(other: Vector3): Vector3;
    copy(): Vector3;
    add(A: Vector3): this;
    subtract(A: Vector3): this;
    array(): number[];
    static min(a: Vector3, b: Vector3): Vector3;
    static max(a: Vector3, b: Vector3): Vector3;
}
export declare class Vector4 extends Vector3 {
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    dot(other: Vector4): number;
    multiplyMat4(mat: Mat4x4): this;
    private getElement;
    copy(): Vector4;
    add(A: Vector4): this;
    subtract(A: Vector4): this;
    array(): number[];
    toVector3(): Vector3;
}
//# sourceMappingURL=vector.d.ts.map