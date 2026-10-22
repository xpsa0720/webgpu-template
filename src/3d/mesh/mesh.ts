import type { Render3DPass } from "../../pass/render_3d_pass";
import {
  SHADER_MATRIAL_STRUCT,
  SHADER_MATRIX_STRUCT,
} from "../../shader/gadget/code/shader_code";
import type { WebGPUBuffer } from "../../types/resource";
import { distance, wgslStructSize } from "../../util/math";
import { Vector3 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
import type { Matrial } from "./matrial/matrial";

export interface MeshParams {
  render3DPass: Render3DPass;
  location: Vector3;
  rotate?: Vector3;
  scale?: Vector3;
  geometry: Geometry;
  matrial: Matrial;
}

export class Mesh {
  render3DPass: Render3DPass;
  location: Vector3; // World Space 기준
  rotate: Vector3; // 방향 벡터가 아닌 각 축의 각도 기준 (0~360)
  scale: Vector3;
  geometry: Geometry;
  matrial: Matrial;
  matrixBuffer: WebGPUBuffer;
  matrialBuffer: WebGPUBuffer;
  AabbCenter!: Vector3;
  AabbRadius!: number;

  constructor({
    location,
    rotate,
    scale,
    geometry,
    render3DPass,
    matrial,
  }: MeshParams) {
    this.render3DPass = render3DPass;
    this.location = location;
    this.geometry = geometry;
    this.matrial = matrial;
    this.rotate = rotate ?? new Vector3(0);
    this.scale = scale ?? new Vector3(1, 1, 1);
    this.AABB();

    const device = render3DPass.device;
    this.matrixBuffer = {
      buffer: device.createBuffer({
        size: wgslStructSize(SHADER_MATRIX_STRUCT),
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.matrialBuffer = {
      buffer: device.createBuffer({
        size: wgslStructSize(SHADER_MATRIAL_STRUCT),
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
  }

  private AABB() {
    let min = new Vector3(Infinity, Infinity, Infinity);
    let max = new Vector3(-Infinity, -Infinity, -Infinity);
    let maxDistance = -Infinity;

    this.geometry.vertex.forEach((e) => {
      min = Vector3.min(min, e.location);
      max = Vector3.max(max, e.location);
    });

    this.AabbCenter = new Vector3(
      (min.x + max.x) / 2,
      (min.y + max.y) / 2,
      (min.z + max.z) / 2,
    );
    
    this.geometry.vertex.forEach((e) => {
      const d = distance(e.location, this.AabbCenter);
      maxDistance = Math.max(maxDistance, d);
    });

    this.AabbRadius = maxDistance;
  }
}
