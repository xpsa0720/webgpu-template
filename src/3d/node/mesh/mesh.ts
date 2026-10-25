import type { Render3DPass } from "../../../pass/render_3d_pass";
import {
  SHADER_MATRIAL_STRUCT,
  SHADER_MESH_MATRIX_STRUCT,
} from "../../../shader/gadget/code/shader_code";
import type { WebGPUBuffer } from "../../../types/resource";
import { distance, wgslStructSize } from "../../../util/math";
import { Vector3 } from "../../math/vector";
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
  private _location!: Vector3; // World Space 기준
  private _rotate!: Vector3; // 방향 벡터가 아닌 각 축의 각도 기준 (라디안)
  private _scale!: Vector3;
  geometry: Geometry;
  matrial: Matrial;
  matrixBuffer: WebGPUBuffer;
  matrialBuffer: WebGPUBuffer;
  cachedBindGroup: GPUBindGroup | null = null;
  AabbCenter!: Vector3;
  AabbRadius!: number;
  // location / rotate / scale이 바뀌면 true (교체 + x/y/z 직접 수정 모두 감지)
  dirty: boolean = true;
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
        size: wgslStructSize(SHADER_MESH_MATRIX_STRUCT),
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

  get location(): Vector3 {
    return this._location;
  }
  set location(value: Vector3) {
    this._location = this.watch(value);
    this.dirty = true;
  }

  get rotate(): Vector3 {
    return this._rotate;
  }
  set rotate(value: Vector3) {
    this._rotate = this.watch(value);
    this.dirty = true;
  }

  get scale(): Vector3 {
    return this._scale;
  }
  set scale(value: Vector3) {
    this._scale = this.watch(value);
    this.dirty = true;
  }

  // Vector3의 x/y/z가 바뀌면 dirty = true (mesh.location.x += 1, mesh.location.add(v) 등)
  private watch(vector: Vector3): Vector3 {
    return new Proxy(vector, {
      set: (target, key, value) => {
        const result = Reflect.set(target, key, value);
        this.dirty = true;
        return result;
      },
    });
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
