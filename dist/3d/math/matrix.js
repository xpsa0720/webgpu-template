import { Vector3, Vector4 } from "./vector";
export class Mat3x3 {
    columns;
    constructor(columns) {
        if (columns && columns.length > 3) {
            throw new Error("3x3 행렬은 원소가 3개까지 제한 됩니다");
        }
        this.columns = columns ?? [];
    }
    // B * A: A.multiply(B) = B * A
    multiply(mat) {
        const cols = new Array(3);
        for (let j = 0; j < 3; j++) {
            const aCol = this.columns[j];
            const x = mat.getRow(0).dot(aCol);
            const y = mat.getRow(1).dot(aCol);
            const z = mat.getRow(2).dot(aCol);
            cols[j] = new Vector3(x, y, z);
        }
        return new Mat3x3(cols);
    }
    multiplyVec3(vec) {
        const x = this.getRow(0).dot(vec);
        const y = this.getRow(1).dot(vec);
        const z = this.getRow(2).dot(vec);
        return new Vector3(x, y, z);
    }
    getElement(column, index) {
        if (index === 0)
            return column.x;
        if (index === 1)
            return column.y;
        return column.z;
    }
    getRow(index) {
        const x = this.getElement(this.columns[0], index);
        const y = this.getElement(this.columns[1], index);
        const z = this.getElement(this.columns[2], index);
        return new Vector3(x, y, z);
    }
    getArrayData() {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result.push(this.columns[i].x);
            result.push(this.columns[i].y);
            result.push(this.columns[i].z);
        }
        return new Float32Array(result);
    }
}
export class Mat4x4 {
    columns;
    constructor(columns) {
        if (columns && columns.length > 4) {
            throw new Error("4x4 행렬은 원소가 4개까지 제한 됩니다");
        }
        this.columns = columns ?? [];
    }
    // B * A: A.multiply(B) = B * A
    // S.multiply(R).multiply(T) → T * R * S 순서로 읽는 순서 = 적용 순서
    multiply(mat) {
        const cols = new Array(4);
        for (let j = 0; j < 4; j++) {
            const aCol = this.columns[j];
            const x = mat.getRow(0).dot(aCol);
            const y = mat.getRow(1).dot(aCol);
            const z = mat.getRow(2).dot(aCol);
            const w = mat.getRow(3).dot(aCol);
            cols[j] = new Vector4(x, y, z, w);
        }
        return new Mat4x4(cols);
    }
    getElement(column, index) {
        if (index === 0)
            return column.x;
        if (index === 1)
            return column.y;
        if (index === 2)
            return column.z;
        return column.w;
    }
    getRow(index) {
        const x = this.getElement(this.columns[0], index);
        const y = this.getElement(this.columns[1], index);
        const z = this.getElement(this.columns[2], index);
        const w = this.getElement(this.columns[3], index);
        return new Vector4(x, y, z, w);
    }
    getArrayData() {
        const result = [];
        for (let i = 0; i < 4; i++) {
            result.push(this.columns[i].x);
            result.push(this.columns[i].y);
            result.push(this.columns[i].z);
            result.push(this.columns[i].w);
        }
        return new Float32Array(result);
    }
}
//# sourceMappingURL=matrix.js.map