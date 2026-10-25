import { Vector3, Vector4 } from "./vector";

export class Mat3x3 {
  columns: Vector3[];
  constructor(columns?: Vector3[]) {
    if (columns && columns.length > 3) {
      throw new Error("3x3 행렬은 원소가 3개까지 제한 됩니다");
    }
    this.columns = columns ?? [];
  }

  // B * A: A.multiply(B) = B * A
  multiply(mat: Mat3x3) {
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

  multiplyVec3(vec: Vector3): Vector3 {
    const x = this.getRow(0).dot(vec);
    const y = this.getRow(1).dot(vec);
    const z = this.getRow(2).dot(vec);
    return new Vector3(x, y, z);
  }

  private getElement(column: Vector3, index: number): number {
    if (index === 0) return column.x;
    if (index === 1) return column.y;
    return column.z;
  }

  getRow(index: number) {
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
  columns: Vector4[];
  constructor(columns?: Vector4[]) {
    if (columns && columns.length > 4) {
      throw new Error("4x4 행렬은 원소가 4개까지 제한 됩니다");
    }
    this.columns = columns ?? [];
  }

  // B * A: A.multiply(B) = B * A
  // S.multiply(R).multiply(T) → T * R * S 순서로 읽는 순서 = 적용 순서
  multiply(mat: Mat4x4) {
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

  private getElement(column: Vector4, index: number): number {
    if (index === 0) return column.x;
    if (index === 1) return column.y;
    if (index === 2) return column.z;
    return column.w;
  }

  getRow(index: number) {
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

  getMatrix() {
    const result = [];

    for (let i = 0; i < 4; i++) {
      result.push(this.columns[i].x);
      result.push(this.columns[i].y);
      result.push(this.columns[i].z);
      result.push(this.columns[i].w);
    }

    return new Float32Array(result);
  }

  getTranslate(): Vector3 {
    return this.columns[3].toVector3();
  }
  multiplyVec4(vec: Vector4): Vector4 {
    const x = this.getRow(0).dot(vec);
    const y = this.getRow(1).dot(vec);
    const z = this.getRow(2).dot(vec);
    const w = this.getRow(3).dot(vec);
    return new Vector4(x, y, z,w);
  }
  getScale(): Vector3 {
    const sx = Math.hypot(this.columns[0].x, this.columns[0].y, this.columns[0].z); // x축 크기
    const sy = Math.hypot(this.columns[1].x, this.columns[1].y, this.columns[1].z);
    const sz = Math.hypot(this.columns[2].x, this.columns[2].y, this.columns[2].z);

    return new Vector3(sx,sy,sz);
  }
}
