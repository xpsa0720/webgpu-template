import type { Render3DPass } from "../../pass/render_3d_pass";
import { SHADER_MATRIAL_STRUCT, SHADER_MATRIX_STRUCT } from "../../shader/gadget/code/shader_code";
import type { Camera } from "../../types/camera";
import type { WebGPUBuffer } from "../../types/resource";
import { distance, wgslStructSize } from "../../util/math";
import { createMatrixData, createViewProjectionMatrix } from "../../util/matrix";
import { Vector3 } from "../math/vector";
import type { Geometry } from "./geometry/geometry";
import type { Matrial } from "./matrial/matrial";

const RANDOM_RANGE = 10;

export interface MeshParams {
  render3DPass: Render3DPass;
    instanceInfo?: InstanceMeshInfo[];
  geometry: Geometry;
}

interface InstanceMeshInfo{
  location: Vector3;
  rotate: Vector3;
  scale: Vector3;
  matrial: Matrial;
}

export class InstanceMesh{
  render3DPass: Render3DPass;
  count: number; // 현재 matrixBuffer, matrialBuffer가 담을 수 있는 인스턴스 개수
  instanceInfo : InstanceMeshInfo[];
  geometry: Geometry;
  matrixBuffer: WebGPUBuffer;
  matrialBuffer: WebGPUBuffer;
  AabbCenter!: Vector3;
  AabbRadius!: number;
    constructor({
      instanceInfo = [],
      geometry,
      render3DPass,
    }: MeshParams) {
      this.render3DPass = render3DPass;
      this.instanceInfo = instanceInfo;
      this.count = instanceInfo.length;
      this.geometry = geometry;
      this.AABB();

      this.matrixBuffer = this.createBuffer(SHADER_MATRIX_STRUCT);
      this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
    }

    update(camera: Camera, aspect: number) {
      if (this.count !== this.instanceInfo.length) {
        this.matrixBuffer.buffer.destroy();
        this.matrialBuffer.buffer.destroy();
        this.count = this.instanceInfo.length;
        this.matrixBuffer = this.createBuffer(SHADER_MATRIX_STRUCT);
        this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
      }
      if (this.count === 0) return;

      const viewProjection = createViewProjectionMatrix(camera, aspect);
      const matrixStride = wgslStructSize(SHADER_MATRIX_STRUCT) / 4;
      const matrialStride = wgslStructSize(SHADER_MATRIAL_STRUCT) / 4;
      const matrixData = new Float32Array(matrixStride * this.count);
      const matrialData = new Float32Array(matrialStride * this.count);

      this.instanceInfo.forEach((info, i) => {
        matrixData.set(createMatrixData(info, viewProjection), i * matrixStride);
        matrialData.set(info.matrial.getDataArray(), i * matrialStride);
      });

      const queue = this.render3DPass.device.queue;
      queue.writeBuffer(this.matrixBuffer.buffer, 0, matrixData);
      queue.writeBuffer(this.matrialBuffer.buffer, 0, matrialData);
    }

    private createBuffer(struct: string): WebGPUBuffer {
      return {
        buffer: this.render3DPass.device.createBuffer({
          size: wgslStructSize(struct) * this.count,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
        }),
      };
    }

    static randomInstanceInfo(count: number, matrial: Matrial): InstanceMeshInfo[] {
      const random = () => (Math.random() * 2 - 1) * RANDOM_RANGE;
      return Array.from({ length: count }, () => ({
        location: new Vector3(random(), random(), random()),
        rotate: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        matrial,
      }));
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