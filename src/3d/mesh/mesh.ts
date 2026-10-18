import type { WP } from "../../core/wp";
import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector3 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
import type { Vertex } from "./unit/vertex";

export interface MeshParams {
  render3DPass: Render3DPass;
  location: Vector3
  rotate?: Vector3;
  scale?: Vector3;
  geometry:Geometry;
}

export class Mesh{
  render3DPass: Render3DPass;
  location: Vector3;  // World Space 기준
  rotate: Vector3; // 방향 벡터가 아닌 각 축의 각도 기준 (0~360)
  scale: Vector3;
  geometry:Geometry;

  constructor({ location, rotate, scale, geometry, render3DPass }: MeshParams) {
    this.render3DPass = render3DPass;
    this.location = location;
    this.geometry = geometry
    this.rotate = rotate ?? new Vector3(0);
    this.scale = scale ??  new Vector3(1,1,1);
  }
}