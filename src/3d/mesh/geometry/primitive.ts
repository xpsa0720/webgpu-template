export interface PrimitiveParams {
  v1: number;
  v2: number;
  v3: number;
}

export class Primitive {
  v1: number;
  v2: number;
  v3: number;

  constructor({v1, v2, v3 }: PrimitiveParams) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
  }
}
