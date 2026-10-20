import type { Mesh } from "../3d/mesh/mesh";
import { ShaderGadgetModule } from "../shader/core/shader_module";
import type { Camera } from "../types/camera";
import type { OutGPUBuffer } from "../types/pass";
import type { WebGPUBuffer } from "../types/resource";
import { createMatrix } from "../util/matrix";
import {
  vertexLayoutFromWGSL,
  type VertexLayout,
  type VertexLayoutOptions,
} from "../util/vertex_layout";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import { RenderPass, type RenderPassArg } from "./render_pass";

interface Render3DPassArg extends RenderPassArg {
  target: GPUTexture | HTMLCanvasElement;
  meshs?: Mesh[];
  camera: Camera;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
}

export class Render3DPass extends RenderPass {
  meshs: Mesh[];
  camera: Camera;
  matrixBuffer: WebGPUBuffer;
  cameraBuffer: WebGPUBuffer;
  shaderGadgetModule: ShaderGadgetModule;
  shaderModule: GPUShaderModule;
  pipeline: GPURenderPipeline;
  protected bindGroupMatrix: GPUBindGroup | null = null;
  protected bindGroupLight: GPUBindGroup | null = null;
  private depthTexture: GPUTexture | null = null;
  private depthWidth = 0;
  private depthHeight = 0;
  constructor(arg: Render3DPassArg) {
    super(arg);
    this.meshs = arg.meshs ?? [];
    this.shaderGadgetModule = new ShaderGadgetModule();
    this.shaderModule = this.createShaderModule();
    this.pipeline = this.settingPipeline();
    this.camera = arg.camera;
    this.matrixBuffer = {
      buffer: this.device.createBuffer({
        size: 16 * 2 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.cameraBuffer = {
      buffer: this.device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
  }

  createShaderModule() {
    return this.device.createShaderModule({
      code: this.shaderGadgetModule.getSourceCode(),
    });
  }

  settingPipeline(): GPURenderPipeline {
    const pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.shaderGadgetModule.getVsEntryPoint(),
        module: this.shaderModule,
        buffers: this.shaderGadgetModule.getVertexLayout(),
      },
      fragment: {
        entryPoint: this.shaderGadgetModule.getFsEntryPoint(),
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
        frontFace: "ccw",
        cullMode: "back",
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

  encoderWriteCommand(
    encoder: GPUCommandEncoder,
    renderPassDescriptor: GPURenderPassDescriptor,
  ) {
    const aspect = this.getAspect();
    const [width, height] = this.getTargetSize();
    if (
      !this.depthTexture ||
      this.depthWidth !== width ||
      this.depthHeight !== height
    ) {
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
      createMatrix(mesh, this.camera, aspect, this.device, this.matrixBuffer);
      this.device.queue.writeBuffer(
        this.cameraBuffer.buffer,
        0,
        new Float32Array([
          this.camera.position.x,
          this.camera.position.y,
          this.camera.position.z,
          1
        ]),
      );

      this.bindGroupMatrix = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(3),
        entries: [
          { binding: 0, resource: { buffer: this.matrixBuffer.buffer } },
          { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
        ],
      });
      this.bindGroupLight = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(4),
        entries: this.shaderGadgetModule.module.fragment.getBindGroupEntry(),
      });
      pass.setBindGroup(3, this.bindGroupMatrix);

      

      pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
      pass.drawIndexed(mesh.geometry.indexs.length);
    });

    pass.end();
  }

  // createPass(
  //   encoder: GPUCommandEncoder,
  //   debugArg?: DebugPassArg,
  // ): OutGPUBuffer[] {
  //   this.ensureBindGroups();

  //   const view = this.context
  //     ? this.context.getCurrentTexture().createView()
  //     : (this.target as GPUTexture).createView();

  //   const renderPassDescriptor: GPURenderPassDescriptor = {
  //     colorAttachments: [
  //       {
  //         view: view,
  //         loadOp: this.loadOp,
  //         storeOp: "store",
  //         clearValue: { r: 0, g: 0, b: 0, a: 1 },
  //       },
  //     ],
  //   };
  //   if (debugArg?.time && this.debugMode) {
  //     renderPassDescriptor.timestampWrites = {
  //       querySet: debugArg.querySet,
  //       beginningOfPassWriteIndex: debugArg.time?.startIndex ?? undefined,
  //       endOfPassWriteIndex: debugArg.time?.endIndex ?? undefined,
  //     };
  //   }

  //   this.encoderWriteCommand(encoder, renderPassDescriptor);

  //   return super.createPass(encoder);
  // }
}
