import type { Render3DPass } from "../../../../pass/render_3d_pass";
import { toRadian } from "../../../../util/math";
import { Vector3 } from "../../../math/vector";
import { Geometry } from "../geometry/geometry";
import { Matrial } from "../matrial/matrial";
import { Mesh } from "../mesh";
import { Vertex } from "../unit/vertex";

export interface SphereParams {
  render3DPass: Render3DPass;
  location: Vector3;
  rotate?: Vector3;
  scale?: Vector3;
  radius?: number;
  matrial?: Matrial;
}

export class Sphere extends Mesh {
  radius: number;
  constructor({
    location,
    rotate,
    scale,
    render3DPass,
    radius = 1,
    matrial = new Matrial({ color: new Vector3(1, 1, 1) }),
  }: SphereParams) {
    const vertex: Vertex[] = [];
    const unit = 5;
    const arrayWidth = 360 / unit;
    const arrayHeight = (180 / unit)-1;
    for (let phi = unit; phi <= 180; phi += unit) {
      for (let theta = unit; theta <= 360; theta += unit) {
        const radPhi = toRadian(phi);
        const radTheta = toRadian(theta);
        const x = radius * Math.sin(radPhi) * Math.cos(radTheta);
        const y = radius * Math.cos(radPhi);
        const z = radius * Math.sin(radPhi) * Math.sin(radTheta);

        vertex.push(
          new Vertex({
            location: new Vector3(x, y, z),
            normal: new Vector3(x / radius, y / radius, z / radius),
          }),
        );
      }
    }
    const index: number[] = [];
    const vertexLength = vertex.length;
    for (let i = 0; i < vertexLength; i++) {
      const x = i % arrayWidth;
      const y = Math.floor(i / arrayWidth);
      const right = (x + 1) % arrayWidth;

      const a = x + y * arrayWidth;
      const b = right + (y + 1) * arrayWidth;
      const c = x + (y + 1) * arrayWidth;
      const d = right + y * arrayWidth;
      
      if (y === 0) {
        index.push(a, vertexLength,d, );
      } else if (y === arrayHeight) {
        index.push(a, d, vertexLength+1);
        continue;
      }
      index.push(a, b, c, a, d, b);
    }

    vertex.push(
      new Vertex({
        location: new Vector3(0, radius, 0),
        normal: new Vector3(0, 1, 0),
      }),
      new Vertex({
        location: new Vector3(0, -radius, 0),
        normal: new Vector3(0, -1, 0),
      }),
    );

    const geometry = new Geometry(render3DPass, vertex, index);
    super({ location, rotate, scale, geometry, render3DPass, matrial });
    this.radius = radius;
  }
}
