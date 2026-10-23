import { Vector2, Vector3 } from "../../math/vector";

interface VertexParams {
  location: Vector3;
  normal?: Vector3;
  uv?:Vector2;
}

export class Vertex {
  location: Vector3;
  normal: Vector3;
  uv:Vector2;
  normalUnspecified: boolean;

  constructor({ location, normal,uv }: VertexParams) {
    this.location = location;
    this.normal = normal ?? new Vector3(0, 0, 0);
    this.normalUnspecified = normal ? false : true;
    this.uv = uv ?? new Vector2(0,0);
  }
}
