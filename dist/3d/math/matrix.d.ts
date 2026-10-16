import { Vector3, Vector4 } from "./vector";
export declare class Mat3x3 {
    columns: Vector3[];
    constructor(columns?: Vector3[]);
    multiply(mat: Mat3x3): Mat3x3;
    multiplyVec3(vec: Vector3): Vector3;
    private getElement;
    getRow(index: number): Vector3;
    getArrayData(): Float32Array<ArrayBuffer>;
}
export declare class Mat4x4 {
    columns: Vector4[];
    constructor(columns?: Vector4[]);
    multiply(mat: Mat4x4): Mat4x4;
    private getElement;
    getRow(index: number): Vector4;
    getArrayData(): Float32Array<ArrayBuffer>;
}
//# sourceMappingURL=matrix.d.ts.map