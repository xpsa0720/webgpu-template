import type { Render3DPass } from "../../../../pass/render_3d_pass";
import { Vector3 } from "../../../math/vector";
import { Geometry } from "../geometry/geometry";
import { Matrial } from "../matrial/matrial";
import { Mesh } from "../mesh";
import { Vertex } from "../unit/vertex";
interface MeshParams {
  render3DPass: Render3DPass;
  location: Vector3;
  rotate?: Vector3;
  scale?: Vector3;
  width?: number;
  height?: number;
  depth?: number;
  matrial?: Matrial;
}

export class Cube extends Mesh {
  constructor({
    location,
    rotate,
    scale,
    render3DPass,
    width = 1,
    height = 1,
    depth = 1,
    matrial = new Matrial({ color: new Vector3(1, 1, 1) }),
  }: MeshParams) {
    const vertex: Vertex[] = [
      //정면
      new Vertex({ location: new Vector3(-width / 2, -height / 2, depth / 2) }),//  3
      new Vertex({ location: new Vector3(width / 2, height / 2, depth / 2) }),//    2
      new Vertex({ location: new Vector3(-width / 2, height / 2, depth / 2) }),//   1

      // new Vertex({ location: new Vector3(-width / 2, -height / 2, depth / 2) }),//  3
      new Vertex({ location: new Vector3(width / 2, -height / 2, depth / 2) }),//   4
      // new Vertex({ location: new Vector3(width / 2, height / 2, depth / 2) }),//    2

      //우면
      new Vertex({ location: new Vector3(width / 2, -height / 2, depth / 2) }),//   4
      new Vertex({ location: new Vector3(width / 2, height / 2, -depth / 2) }),//   6
      new Vertex({ location: new Vector3(width / 2, height / 2, depth / 2) }),//    2
      
      // new Vertex({ location: new Vector3(width / 2, -height / 2, depth / 2) }),//   4
      new Vertex({ location: new Vector3(width / 2, -height / 2, -depth / 2) }),//  8
      // new Vertex({ location: new Vector3(width / 2, height / 2, -depth / 2) }),//   6


      //후면
      new Vertex({ location: new Vector3(width / 2, -height / 2, -depth / 2) }),//  8
      new Vertex({ location: new Vector3(-width / 2, height / 2, -depth / 2) }),//  5
      new Vertex({ location: new Vector3(width / 2, height / 2, -depth / 2) }),//   6

      // new Vertex({ location: new Vector3(width / 2, -height / 2, -depth / 2) }),//  8
      new Vertex({location: new Vector3(-width / 2, -height / 2, -depth / 2),}),//  7
      // new Vertex({ location: new Vector3(-width / 2, height / 2, -depth / 2) }),//  5


      //좌면
      new Vertex({location: new Vector3(-width / 2, -height / 2, -depth / 2),}),//  7
      new Vertex({ location: new Vector3(-width / 2, height / 2, depth / 2) }),//   1
      new Vertex({ location: new Vector3(-width / 2, height / 2, -depth / 2) }),//  5
      
      // new Vertex({location: new Vector3(-width / 2, -height / 2, -depth / 2),}),//  7
      new Vertex({ location: new Vector3(-width / 2, -height / 2, depth / 2) }),//  3
      // new Vertex({ location: new Vector3(-width / 2, height / 2, depth / 2) }),//   1

      //상면
      new Vertex({ location: new Vector3(-width / 2, height / 2, depth / 2) }),//   1
      new Vertex({ location: new Vector3(width / 2, height / 2, -depth / 2) }),//   6
      new Vertex({ location: new Vector3(-width / 2, height / 2, -depth / 2) }),//  5
      
      // new Vertex({ location: new Vector3(-width / 2, height / 2, depth / 2) }),//   1
      new Vertex({ location: new Vector3(width / 2, height / 2, depth / 2) }),//    2
      // new Vertex({ location: new Vector3(width / 2, height / 2, -depth / 2) }),//   6

      //하면
      new Vertex({location: new Vector3(-width / 2, -height / 2, -depth / 2),}),//  7
      new Vertex({ location: new Vector3(width / 2, -height / 2, depth / 2) }),//   4
      new Vertex({ location: new Vector3(-width / 2, -height / 2, depth / 2) }),//  3
      
      // new Vertex({location: new Vector3(-width / 2, -height / 2, -depth / 2),}),//  7
      new Vertex({ location: new Vector3(width / 2, -height / 2, -depth / 2) }),//  8
      // new Vertex({ location: new Vector3(width / 2, -height / 2, depth / 2) }),//   4
    ];
    const index: number[] = [
      0,1,2,
      0,3,1,//정면
      4,5,6,
      4,7,5,//우면
      8,9,10,
      8,11,9,//후면
      12,13,14,
      12,15,13,//좌면
      16,17,18,
      16,19,17,//상면
      20,21,22,
      20,23,21//후면
    ];
    const geometry = new Geometry(render3DPass, vertex, index);

    super({ location, rotate, scale, geometry, render3DPass, matrial });
  }
}
