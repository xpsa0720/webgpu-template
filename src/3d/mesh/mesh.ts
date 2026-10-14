import { Vector3 } from "../math/vector";
import type { Primitive } from "./geometry/primitive";
import type { Vertex } from "./unit/vertex";

export interface MeshParams {
  location: Vector3
  rotate?: Vector3;
  scale?: number;
  vertexs: Vertex[];
  primitives: Primitive[];
}

export class Mesh{
  // 각 정점은 local 위치 기준으로
  location: Vector3;  // World Space 기준
  rotate: Vector3;
  scale: number;
  vertexs: Vertex[];
  primitives: Primitive[];

  constructor({ location, rotate, scale,vertexs, primitives }: MeshParams) {
    this.location = location;
    this.vertexs = vertexs??[];
    this.primitives = primitives??[];
    this.rotate = rotate ?? new Vector3(0);
    this.scale = scale ?? 1;
  }
}