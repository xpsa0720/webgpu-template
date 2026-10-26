import type { Mat4x4 } from "../3d/math/matrix";
import type { Node } from "../3d/node/node";
import { FORMAT_TABLE } from "../shader/gadget/shader_vertex";
import type { OutGPUBuffer } from "../types/pass";
import { gpuBufferSizeFormat, isView } from "../util/math";
import { createMatrix, createModelMatrix } from "../util/matrix";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { Render3DPass } from "./render_3d_pass";


interface ShadowPassArg extends PassArg {
  render3DPass: Render3DPass;
  debugMode?: boolean;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
}

export class ShadowPass extends Pass {
  render3DPass: Render3DPass;
  device: GPUDevice;
  shadowShaderPipeline!: GPURenderPipeline;
  shadowShaderModule!: GPUShaderModule;
  blendState: GPUBlendState | undefined;
  protected debugMode: boolean;
  protected bindGroup: GPUBindGroup | null = null;
  protected bindGroupTex: GPUBindGroup | null = null;
  protected bindGroupSampler: GPUBindGroup | null = null;

  constructor(arg: ShadowPassArg) {
    super(arg);
    this.render3DPass = arg.render3DPass;
    this.debugMode = arg.debugMode ?? false;
    this.device = arg.device;
  }

  settingPipeline() {
    const mesh_pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: "vs",
        module: this.shadowShaderModule,
        buffers: [
          {
            arrayStride: gpuBufferSizeFormat(
              FORMAT_TABLE["float32x3"].byteSize * 1,
            ),
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
        ],
      },
      fragment: {
        entryPoint: "fs",
        module: this.shadowShaderModule,
        targets: [],
      },
      depthStencil: {
        format: "depth32float",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
      },
      primitive: {
        topology: "triangle-list",
        frontFace: "ccw",
        cullMode: "back",
      },
    });
    this.shadowShaderPipeline = mesh_pipeline;
    return mesh_pipeline;
  }

  encoderWriteCommand(
    encoder: GPUCommandEncoder,
    renderPassDescriptor: GPURenderPassDescriptor,
  ) {
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.shadowShaderPipeline);
    if (this.bindGroup) {
      pass.setBindGroup(0, this.bindGroup);
    }
    if (this.bindGroupTex) {
      pass.setBindGroup(1, this.bindGroupTex);
    }
    if (this.bindGroupSampler) {
      pass.setBindGroup(2, this.bindGroupSampler);
    }

    //   const vpMatrix = createViewProjectionMatrix(this.camera, aspect);
    //   // VP는 프레임당 1번만 씀 (Mesh / Node / 인스턴스 공용)
    //   this.vpData.set(vpMatrix.getArrayData());
    //   this.device.queue.writeBuffer(this.vpBuffer.buffer, 0, this.vpData);

    this.render3DPass.meshs.forEach((mesh) => {
      const M = createModelMatrix(mesh);
      if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M)) return;
      if (mesh.dirty) {
        createMatrix(mesh, this.device, mesh.matrixBuffer);
        mesh.dirty = false;
      }
      this.device.queue.writeBuffer(
        mesh.matrialBuffer.buffer,
        0,
        mesh.matrial.getDataArray(),
      );

      if (!mesh.cachedBindGroup) {
        mesh.cachedBindGroup = this.device.createBindGroup({
          layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
          entries: [
            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
            { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
            { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
            { binding: 3, resource: { buffer: this.vpBuffer.buffer } },
            ...this.lightBindGroupEntry,
          ],
        });
      }

      pass.setBindGroup(3, mesh.cachedBindGroup);
      pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
      pass.drawIndexed(mesh.geometry.indexs.length);
    });

    pass.end();
  }

  private nodeRecursionRender(
    nodes: Node[],
    vpMatrix: Mat4x4,
    pass: GPURenderPassEncoder,
  ) {
    nodes.forEach((node) => {
      node.meshs.forEach((mesh) => {
        const M = createModelMatrix(mesh).multiply(node.worldMat);
        if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M)) return;
        createMatrix(mesh, this.device, mesh.matrixBuffer, {
          parentWorldMat: node.worldMat,
          parentNormalMat: node.normalMat,
        });

        this.device.queue.writeBuffer(
          mesh.matrialBuffer.buffer,
          0,
          mesh.matrial.getDataArray(),
        );
        if (!mesh.cachedBindGroup) {
          mesh.cachedBindGroup = this.device.createBindGroup({
            layout: this.shadowShaderPipeline.getBindGroupLayout(3),
            entries: [
              { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
            //   {
            //     binding: 1,
            //     resource: { buffer: this.camera.cameraBuffer!.buffer },
            //   },
              { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
            //   {
            //     binding: 3,
            //     resource: { buffer: this.camera.vpBuffer!.buffer },
            //   },
            //   {
            //     binding: 4,
            //     resource:
            //       mesh.matrial.texture?.texture.createView() ??
            //       this.dummyTextureView,
            //   },
            //   { binding: 5, resource: this.defaultSampler },
              ...this.render3DPass.lightBindGroupEntry,
            ],
          });
        }
        pass.setBindGroup(3, mesh.cachedBindGroup);
        pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
        pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
        pass.drawIndexed(mesh.geometry.indexs.length);
      });
      if (node.children.length > 0)
        this.nodeRecursionRender(node.children, vpMatrix, pass);
    });
  }

  ensureBindGroups() {
    if (!this.bindGroup) {
      const entries: Array<GPUBindGroupEntry> = [];
      for (const [key, value] of Object.entries(this.buffers)) {
        entries.push({
          binding: Number(key),
          resource: { buffer: value.buffer },
        });
      }
      this.bindGroup = this.device.createBindGroup({
        layout: this.meshRenderShaderPipeline.getBindGroupLayout(0),
        entries: entries,
      });
    }
    if (!this.bindGroupTex && Object.keys(this.textures).length > 0) {
      const entries_tex: Array<GPUBindGroupEntry> = [];
      for (const [key, value] of Object.entries(this.textures)) {
        entries_tex.push({
          binding: Number(key),
          resource: value.texture.createView(),
        });
      }
      this.bindGroupTex = this.device.createBindGroup({
        layout: this.meshRenderShaderPipeline.getBindGroupLayout(1),
        entries: entries_tex,
      });
    }
    if (!this.bindGroupSampler && Object.keys(this.sampler).length > 0) {
      const entries_sampler: Array<GPUBindGroupEntry> = [];
      for (const [key, value] of Object.entries(this.sampler)) {
        entries_sampler.push({
          binding: Number(key),
          resource: value.sampler,
        });
      }
      this.bindGroupSampler = this.device.createBindGroup({
        layout: this.meshRenderShaderPipeline.getBindGroupLayout(2),
        entries: entries_sampler,
      });
    }
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.ensureBindGroups();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [],
    };
    // if (debugArg?.time && this.debugMode) {
    //   renderPassDescriptor.timestampWrites = {
    //     querySet: debugArg.querySet,
    //     beginningOfPassWriteIndex: debugArg.time?.startIndex ?? undefined,
    //     endOfPassWriteIndex: debugArg.time?.endIndex ?? undefined,
    //   };
    // }

    this.encoderWriteCommand(encoder, renderPassDescriptor);

    return super.createPass(encoder);
  }
}
