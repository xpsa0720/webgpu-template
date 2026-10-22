import type { InstanceMesh } from "../3d/mesh/instance";
import type { Mesh } from "../3d/mesh/mesh";
import { ShaderGadgetModule } from "../shader/core/shader_module";
import {
  SHADER_CAMERA_POSITION_UNIFORM,
  SHADER_MATRIAL_UNIFORM,
  SHADER_MATRIX_UNIFORM,
} from "../shader/gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIAL_STORAGE, SHADER_INSTANCE_MATRIX_STORAGE, SHADER_INSTANCE_VERTEX } from "../shader/gadget/code/shader_instance";
import { ShaderbindingGadget } from "../shader/gadget/shader_binding";
import {
  AmbientLight,
  DirectionalLight,
  Light,
  PointLight,
} from "../shader/gadget/shader_light";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
import { isView } from "../util/math";
import { createMatrix } from "../util/matrix";
import { RenderPass, type RenderPassArg } from "./render_pass";

interface Render3DPassArg extends RenderPassArg {
  target: GPUTexture | HTMLCanvasElement;
  meshs?: Mesh[];
  instanceMesh?: InstanceMesh[];
  camera: Camera;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
}

export class Render3DPass extends RenderPass {
  meshs: Mesh[];
  instanceMesh: InstanceMesh[];
  camera: Camera;
  cameraBuffer: WebGPUBuffer;
  shaderMeshRenderGadgetModule: ShaderGadgetModule;
  shaderInstanceRenderGadgetModule: ShaderGadgetModule;
  shaderModule: GPUShaderModule;
  pipeline: GPURenderPipeline;

  protected bindGroupMatrix: GPUBindGroup | null = null;
  private depthTexture: GPUTexture | null = null;
  private depthWidth = 0;
  private depthHeight = 0;
  constructor(arg: Render3DPassArg) {
    super(arg);
    this.meshs = arg.meshs ?? [];
    this.instanceMesh = arg.instanceMesh ??[];
    this.shaderMeshRenderGadgetModule = new ShaderGadgetModule({
      device: this.device,
      onLightChange: () => {
        this.shaderModule = this.createShaderModule();
        this.pipeline = this.settingPipeline();
      },
      viewShaderCode: arg.debugMode,
      bindings: [
        new ShaderbindingGadget({
          define: SHADER_MATRIX_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_MATRIAL_UNIFORM,
          type: "uniform",
        }),
      ],
    });
    this.shaderInstanceRenderGadgetModule = new ShaderGadgetModule({
      device: this.device,
      onLightChange: () => {
        this.shaderModule = this.createShaderModule();
        this.pipeline = this.settingPipeline();
      },
      viewShaderCode: arg.debugMode,
      bindings: [
        new ShaderbindingGadget({
          define: SHADER_INSTANCE_MATRIX_STORAGE,
          type: "storage",
        }),
        new ShaderbindingGadget({
          define: SHADER_INSTANCE_MATRIAL_STORAGE,
          type: "storage",
        }),
      ],
      vertexCode: SHADER_INSTANCE_VERTEX
    });
    this.shaderModule = this.createShaderModule();
    this.pipeline = this.settingPipeline();
    this.camera = arg.camera;
    this.cameraBuffer = {
      buffer: this.device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
  }

  createShaderModule() {
    return this.device.createShaderModule({
      code: this.shaderMeshRenderGadgetModule.getSourceCode(),
    });
  }

  settingPipeline(): GPURenderPipeline {
    const pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.shaderMeshRenderGadgetModule.getVsEntryPoint(),
        module: this.shaderModule,
        buffers: this.shaderMeshRenderGadgetModule.getVertexLayout(),
      },
      fragment: {
        entryPoint: this.shaderMeshRenderGadgetModule.getFsEntryPoint(),
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

  private get pointLightGadget() {
    return this.shaderMeshRenderGadgetModule.module.fragment.shaderLights[0];
  }

  private get ambientLightGadget() {
    return this.shaderMeshRenderGadgetModule.module.fragment.shaderLights[1];
  }

  private get directionalLightGadget() {
    return this.shaderMeshRenderGadgetModule.module.fragment.shaderLights[2];
  }

  addLight(light: Light) {
    if (light instanceof PointLight) {
      this.pointLightGadget.addLight(light);
    } else if (light instanceof AmbientLight) {
      this.ambientLightGadget.addLight(light);
    } else if (light instanceof DirectionalLight) {
      this.directionalLightGadget.addLight(light);
    }
  }

  removeLight(light: Light) {
    if (light instanceof PointLight) {
      const idx = this.pointLightGadget.lights.indexOf(light);
      if (idx !== -1) return this.pointLightGadget.removeLight(idx);
    } else if (light instanceof AmbientLight) {
      const idx = this.ambientLightGadget.lights.indexOf(light);
      if (idx !== -1) return this.ambientLightGadget.removeLight(idx);
    } else if (light instanceof DirectionalLight) {
      const idx = this.directionalLightGadget.lights.indexOf(light);
      if (idx !== -1) return this.directionalLightGadget.removeLight(idx);
    }
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

    this.device.queue.writeBuffer(
      this.cameraBuffer.buffer,
      0,
      new Float32Array([
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
        1,
      ]),
    );

    this.meshs.forEach((mesh) => {
      // 나중에 구현해야됨
      // if (isView(mesh)) {

      // }
      createMatrix(mesh, this.camera, aspect, this.device, mesh.matrixBuffer);

      this.device.queue.writeBuffer(
        mesh.matrialBuffer.buffer,
        0,
        new Float32Array(mesh.matrial.getDataArray()),
      );

      this.bindGroupMatrix = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(3),
        entries: [
          { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
          { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
          { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
            ...this.shaderMeshRenderGadgetModule.module.fragment.bindGroupEntry
        ],
      });

      pass.setBindGroup(3, this.bindGroupMatrix);
      pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
      pass.drawIndexed(mesh.geometry.indexs.length);
    });


    this.instanceMesh.forEach((instanceMesh) => {
      // 나중에 구현해야됨
      // if (isView(mesh)) {

      // }

      this.bindGroupMatrix = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(3),
        entries: [
          { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
            ...this.shaderInstanceRenderGadgetModule.module.vertex.bindGroupEntry
        ],
      });

      pass.setBindGroup(3, this.bindGroupMatrix);
      pass.setVertexBuffer(0, instanceMesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(instanceMesh.geometry.indexBuffer.buffer, "uint16");
      pass.drawIndexed(instanceMesh.geometry.indexs.length, instanceMesh.count);
    });

    pass.end();
  }
}
