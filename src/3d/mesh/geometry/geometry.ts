import type { Render3DPass } from "../../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../../types/resource";
import type { Vertex } from "../unit/vertex";

export class Geometry {
  private _vertex: Vertex[];
  indexs: number[];
  indexBuffer: WebGPUBuffer;
  vertexBuffer: WebGPUBuffer;
  render3DPass: Render3DPass;
  device: GPUDevice;

  constructor(render3DPass: Render3DPass, vertex: Vertex[], indexs: number[]) {
    this.render3DPass = render3DPass;
    this.device = this.render3DPass.device;
    this._vertex = vertex;
    this.indexs = indexs;

    this.vertexBuffer = this.updateVertexBuffer();
    this.indexBuffer = this.updateIndexBuffer();
  }

  updateVertexBuffer() {
    const buffer = {
      buffer: this.device.createBuffer({
        size: this._vertex.length * 3 * 4,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      }),
    };

    const data = new Float32Array(this._vertex.length * 3);
    this._vertex.forEach((vertex, i) => {
      const idx = i * 3;
      data[idx] = vertex.x;
      data[idx+1] = vertex.y;
      data[idx+2] = vertex.z;
    });
    this.device.queue.writeBuffer(buffer.buffer, 0, data);

    return buffer;
  }
  updateIndexBuffer() {
    const buffer = {
      buffer: this.device.createBuffer({
        size: Math.ceil((this.indexs.length * 2) / 4) * 4,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      }),
    };

    const alignedLen = Math.ceil((this.indexs.length * 2) / 4) * 2;
    const data = new Uint16Array(alignedLen);
    this.indexs.forEach((index, i) => {
      data[i] = index;
    });
    this.device.queue.writeBuffer(buffer.buffer, 0, data);
    return buffer;
  }

  pushVertex(vertex: Vertex) {
    this._vertex.push(vertex);
    this.vertexBuffer = this.updateVertexBuffer();
    this.indexs.push(this._vertex.length - 1);
    this.indexBuffer = this.updateIndexBuffer();
  }
  popVertex() {
    this._vertex.pop();
    this.vertexBuffer = this.updateVertexBuffer();
    this.indexs.pop();
    this.indexBuffer = this.updateIndexBuffer();
  }

  get vertex(): Vertex[] {
    return this._vertex;
  }

  set vertex(value: Vertex[]) {
    this._vertex = value;
  }
}
