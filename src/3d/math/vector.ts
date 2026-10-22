import type { Mat4x4 } from "./matrix";

export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  crossProduct(other: Vector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  copy() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(A: Vector3) {
    this.x += A.x;
    this.y += A.y;
    this.z += A.z;

    return this;
  }

  subtract(A: Vector3) {
    this.x -= A.x;
    this.y -= A.y;
    this.z -= A.z;

    return this;
  }

  array() {
    return [this.x, this.y, this.z, 0];
  }

  static min(a: Vector3, b: Vector3) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const z = Math.min(a.z, b.z);

    return new Vector3(x, y, z);
  }
  static max(a: Vector3, b: Vector3) {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const z = Math.max(a.z, b.z);

    return new Vector3(x, y, z);
  }
}

export class Vector4 extends Vector3 {
  w: number;

  constructor(x = 0, y = 0, z = 0, w = 0) {
    super(x, y, z);
    this.w = w;
  }

  dot(other: Vector4): number {
    return (
      this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
    );
  }

  multiplyMat4(mat: Mat4x4) {
    const result = this.copy();
    this.x = mat.getRow(0).dot(result);
    this.y = mat.getRow(1).dot(result);
    this.z = mat.getRow(2).dot(result);
    this.w = mat.getRow(3).dot(result);

    return this;
  }

  private getElement(index: number) {
    if (index === 0) return this.x;
    if (index === 1) return this.y;
    if (index === 2) return this.z;
    if (index === 3) return this.w;
    return this.w;
  }

  copy() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }

  subtract(A: Vector4) {
    this.x -= A.x;
    this.y -= A.y;
    this.z -= A.z;
    this.w -= A.w;

    return this;
  }
  array() {
    return [this.x, this.y, this.z, this.w];
  }
  toVector3() {
    return new Vector3(this.x, this.y, this.z);
  }
}
