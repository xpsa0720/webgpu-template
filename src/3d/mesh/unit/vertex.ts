import { Vector3 } from "../../math/vector";

interface VertexParams {
  location: Vector3;
  normal?: Vector3;
}

export class Vertex {
  location: Vector3;
  normal: Vector3;
  normalUnspecified: boolean;

  constructor({ location, normal }: VertexParams) {
    this.location = location;
    this.normal = normal ?? new Vector3(0, 0, 0);
    this.normalUnspecified = normal ? false : true;
  }
}
