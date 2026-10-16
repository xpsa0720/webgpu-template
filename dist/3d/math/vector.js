export class Vector3 {
    x;
    y;
    z;
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    copy() {
        return new Vector3(this.x, this.y, this.z);
    }
    subtract(A) {
        this.x -= A.x;
        this.y -= A.y;
        this.z -= A.z;
        return this;
    }
}
export class Vector4 extends Vector3 {
    w;
    constructor(x = 0, y = 0, z = 0, w = 0) {
        super(x, y, z);
        this.w = w;
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }
    multiplyMat4(mat) {
        const result = this.copy();
        this.x = mat.getRow(0).dot(result);
        this.y = mat.getRow(1).dot(result);
        this.z = mat.getRow(2).dot(result);
        this.w = mat.getRow(3).dot(result);
    }
    getElement(index) {
        if (index === 0)
            return this.x;
        if (index === 1)
            return this.y;
        if (index === 2)
            return this.z;
        if (index === 3)
            return this.w;
        return this.w;
    }
    copy() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
    subtract(A) {
        this.x -= A.x;
        this.y -= A.y;
        this.z -= A.z;
        this.w -= A.w;
        return this;
    }
}
//# sourceMappingURL=vector.js.map