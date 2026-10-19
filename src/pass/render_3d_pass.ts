import type { Light } from "../3d/light/light";
import type { Mesh } from "../3d/mesh/mesh";
import type { Camera } from "../types/camera";
import type { OutGPUBuffer } from "../types/pass";
import type { WebGPUBuffer } from "../types/resource";
import { createMatrix } from "../util/matrix";
import {
  vertexLayoutFromWGSL,
  type VertexLayout,
  type VertexLayoutOptions,
} from "../util/vertex_layout";
import type { DebugPassArg, PassArg } from "./pass";
import { RenderPass, type RenderPassArg } from "./render_pass";

interface Render3DPassArg extends RenderPassArg {
  vertexLayoutOptions?: VertexLayoutOptions;
  meshs?: Mesh[];
  lights?: Light[];
  camera: Camera;
}

export class Render3DPass extends RenderPass {
  meshs: Mesh[];
  lights: Light[];
  camera: Camera;
  vertexLayout: VertexLayout;
  protected bindGroupMatrix: GPUBindGroup | null = null;
  private depthTexture: GPUTexture | null = null;
  private depthWidth = 0;
  private depthHeight = 0;
  constructor(arg: Render3DPassArg) {
    super(arg);
    this.meshs = arg.meshs ?? [];
    this.lights = arg.lights??[]
    this.vertexLayout = vertexLayoutFromWGSL(
      this.shaderCode,
      this.vertexEntryPoint,
      arg.vertexLayoutOptions,
    );
    this.pipeline = this.settingPipeline();
    this.camera = arg.camera;

  }

  override settingPipeline(shaderCode?: string): GPURenderPipeline {
    if (shaderCode) {
      this.shaderModule = this.device.createShaderModule({
        code: shaderCode,
      });
      this.shaderCode = shaderCode
    }

    const pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.vertexEntryPoint,
        module: this.shaderModule,
        buffers: this.vertexLayout.buffers,
      },
      fragment: {
        entryPoint: this.fragmentEntryPoint,
        module: this.shaderModule,
        targets: [
          {
            format: this.format,
            blend: this.blendState,
          },
        ],
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
      primitive: {
        topology: "triangle-list",
        frontFace:"ccw",
        cullMode: "back"
      },
    });
    return pipeline;
  }

  private getTargetSize(): [number, number] {
    if (this.target instanceof HTMLCanvasElement) {
      return [this.target.width, this.target.height];
    }
    return [this.target.width, this.target.height];
  }

  private getAspect(): number {
    const [w, h] = this.getTargetSize();
    return w / h;
  }

  override encoderWriteCommand(
    encoder: GPUCommandEncoder,
    renderPassDescriptor: GPURenderPassDescriptor,
  ) {
    const aspect = this.getAspect();
    const [width, height] = this.getTargetSize();
    if (!this.depthTexture || this.depthWidth !== width || this.depthHeight !== height) {
      this.depthTexture?.destroy();
      this.depthTexture = this.device.createTexture({
        size: [width, height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.depthWidth = width;
      this.depthHeight = height;
    }
    renderPassDescriptor.depthStencilAttachment = {
      view: this.depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    };
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    if (this.bindGroup) {
      pass.setBindGroup(0, this.bindGroup);
    }
    if (this.bindGroupTex) {
      pass.setBindGroup(1, this.bindGroupTex);
    }
    if (this.bindGroupSampler) {
      pass.setBindGroup(2, this.bindGroupSampler);
    }

    this.meshs.forEach((mesh) => {
      const matrixBuffer = createMatrix(
        mesh,
        this.camera,
        aspect,
        this.device,
      );

      this.bindGroupMatrix = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(3),
        entries: [{ binding: 0, resource: { buffer: matrixBuffer.buffer } }],
      });

      pass.setBindGroup(3, this.bindGroupMatrix);

      pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
      pass.drawIndexed(mesh.geometry.indexs.length);
    });

    pass.end();
  }

  override createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {

    return super.createPass(encoder);
  }
}
