import type { Mat4x4 } from "../3d/math/matrix";
import type { InstanceMesh } from "../3d/node/mesh/instance";
import type { Mesh } from "../3d/node/mesh/mesh";
import type { Node } from "../3d/node/node";
import { ShaderGadgetInstanceMeshModule } from "../shader/core/shader_instance_mesh_module";
import { ShaderGadgetMeshModule } from "../shader/core/shader_mesh_module";
import {
  AMBIENT_LIGHT,
  DIRECTIONAL_LIGHT,
  POINT_LIGHT,
  SHADER_SHADOW_SAMPLER,
} from "../shader/gadget/code/shader_code";
import { AmbientLight } from "../3d/light/ambient_light";
import { DirectionalLight } from "../3d/light/directional_light";
import type { Light } from "../3d/light/light";
import { PointLight } from "../3d/light/point_light";
import {
  formatLightCount,
  ShaderAmbientLightGadget,
  ShaderDirectionalLightGadget,
  ShaderLightGadget,
  ShaderPointLightGadget,
  type ShadowGadget,
} from "../shader/gadget/shader_light";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
import { isView } from "../util/math";
import {
  createMatrix,
  createModelMatrix,
} from "../util/matrix";
import { roundUp } from "../util/vertex_layout";
import { RenderPass, type RenderPassArg } from "./render_pass";
import { ShadowPass } from "./shadow_pass";
import { ShadowResources } from "./shadow_resources";

interface Render3DPassArg extends RenderPassArg {
  target: GPUTexture | HTMLCanvasElement;
  meshs?: Mesh[];
  nodes?: Node[];
  instanceMesh?: InstanceMesh[];
  camera: Camera;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
  debugViewShaderCode?: boolean;
}

export class Render3DPass extends RenderPass {
  meshs: Mesh[];
  nodes: Node[];
  instanceMesh: InstanceMesh[];
  camera: Camera;

  shaderLights: Record<number, ShaderLightGadget<any>>;
  lightBindGroupEntry!: GPUBindGroupEntry[];

  /** 모든 ShaderLightGadget에 등록된 light를 모아서 반환 */
  get lights(): Light[] {
    const result: Light[] = [];
    for (const gadget of Object.values(this.shaderLights)) {
      result.push(...gadget.lights);
    }
    return result;
  }

  shaderMeshRenderGadgetModule: ShaderGadgetMeshModule;
  shaderInstanceRenderGadgetModule: ShaderGadgetInstanceMeshModule;

  meshRenderShaderModule!: GPUShaderModule;
  // meshRenderShaderPipeline!: GPURenderPipeline;

  instnaceMeshRenderShaderModule!: GPUShaderModule;
  instnaceMeshRenderShaderPipeline!: GPURenderPipeline;

  shadowPass: ShadowPass;
  shadowResources: ShadowResources;

  private depthTexture: GPUTexture | null = null;
  private depthWidth = 0;
  private depthHeight = 0;
  private defaultSampler: GPUSampler;
  private dummyTextureView: GPUTextureView;
  // 매 프레임 재사용할 Float32Array
  constructor(arg: Render3DPassArg) {
    super(arg);
    this.meshs = arg.meshs ?? [];
    this.nodes = arg.nodes ?? [];
    this.instanceMesh = arg.instanceMesh ?? [];
    this.shaderLights = this.initLight();
    this.updateBindGroupEntray();
    this.shaderMeshRenderGadgetModule = new ShaderGadgetMeshModule({
      device: this.device,
      viewShaderCode: arg.debugViewShaderCode ?? arg.debugMode,
    });
    this.shaderInstanceRenderGadgetModule = new ShaderGadgetInstanceMeshModule({
      device: this.device,
      viewShaderCode: arg.debugViewShaderCode ?? arg.debugMode,
    });
    this.createShaderModule();
    this.settingPipeline();
    this.camera = arg.camera;
    this.camera.cameraBuffer = {
      buffer: this.device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.camera.vpBuffer = {
      buffer: this.device.createBuffer({
        size: 4 * 16,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.shadowResources = new ShadowResources(this.device);
    this.shadowResources.update(this.shaderLights);
    this.shadowPass = new ShadowPass({device:this.device, render3DPass: this})

    this.defaultSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const dummyTex = this.device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture(
      { texture: dummyTex },
      new Uint8Array([255, 255, 255, 255]),
      { bytesPerRow: 4 },
      [1, 1, 1],
    );
    this.dummyTextureView = dummyTex.createView();
  }

  private initLight() {
    const result: Record<number, ShaderLightGadget<any>> = {};
    const usedBindings = new Set<number>();

    const LIGHT_CODE_LIST = [
      new ShaderPointLightGadget({
        struct: POINT_LIGHT.struct,
        define: POINT_LIGHT.define,
        countPlaceholder: POINT_LIGHT.countPlaceholder,
        lengthPlaceholder: POINT_LIGHT.lengthPlaceholder,
        group: 3,
        binding: 10,
        code: POINT_LIGHT.code,
        func: POINT_LIGHT.func,
        device: this.device,
        shadowAddCode: POINT_LIGHT.shadowAddCode,
        shadowAddFunc: POINT_LIGHT.shadowAddFunc,
      }),
      new ShaderAmbientLightGadget({
        struct: AMBIENT_LIGHT.struct,
        define: AMBIENT_LIGHT.define,
        countPlaceholder: AMBIENT_LIGHT.countPlaceholder,
        lengthPlaceholder: AMBIENT_LIGHT.lengthPlaceholder,
        group: 3,
        binding: 11,
        code: AMBIENT_LIGHT.code,
        func: AMBIENT_LIGHT.func,
        device: this.device,
      }),
      new ShaderDirectionalLightGadget({
        struct: DIRECTIONAL_LIGHT.struct,
        define: DIRECTIONAL_LIGHT.define,
        countPlaceholder: DIRECTIONAL_LIGHT.countPlaceholder,
        lengthPlaceholder: DIRECTIONAL_LIGHT.lengthPlaceholder,
        group: 3,
        binding: 12,
        code: DIRECTIONAL_LIGHT.code,
        func: DIRECTIONAL_LIGHT.func,
        device: this.device,
        shadowAddCode: DIRECTIONAL_LIGHT.shadowAddCode,
        shadowAddFunc: DIRECTIONAL_LIGHT.shadowAddFunc,
      }),
    ];
    LIGHT_CODE_LIST.forEach((e, i) => {
      if (usedBindings.has(e.binding)) {
        throw new Error(`Light binding 번호 ${e.binding}이 중복됨`);
      }
      usedBindings.add(e.binding);
      result[i] = e;
    });
    return result;
  }

  createShaderModule() {
    let structCode = "";
    let functionCode = "";
    let fragmentCode = "";
    let shadowDefinesCode = "";

    const lightGadgets = Object.values(this.shaderLights).sort(
      (a, b) => a.binding - b.binding,
    );

    lightGadgets.forEach((light) => {
      structCode += light.getStructUniformCode() + "\n";
      functionCode += light.getFunctionCode() + "\n";
      fragmentCode += light.getCode() + "\n";
      if (isShadowGadget(light)) {
        shadowDefinesCode += light.getShadowDefinesCode();
      }
    });

    if (shadowDefinesCode.length > 0) {
      shadowDefinesCode = SHADER_SHADOW_SAMPLER + "\n" + shadowDefinesCode;
    }

    this.meshRenderShaderModule = this.device.createShaderModule({
      code: this.shaderMeshRenderGadgetModule.getSourceCode({
        lightStructsUniforms: structCode,
        lightCode: fragmentCode,
        funtionCode: functionCode,
        shadowDefinesCode: shadowDefinesCode
      }),
    });

    this.instnaceMeshRenderShaderModule = this.device.createShaderModule({
      code: this.shaderInstanceRenderGadgetModule.getSourceCode({
        lightStructsUniforms: structCode,
        lightCode: fragmentCode,
        funtionCode: functionCode,
        shadowDefinesCode: shadowDefinesCode
      }),
    });
  }

  settingPipeline() {
    const mesh_pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.shaderMeshRenderGadgetModule.getVsEntryPoint(),
        module: this.meshRenderShaderModule,
        buffers: this.shaderMeshRenderGadgetModule.getVertexLayout(),
      },
      fragment: {
        entryPoint: this.shaderMeshRenderGadgetModule.getFsEntryPoint(),
        module: this.meshRenderShaderModule,
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
    this.meshRenderShaderPipeline = mesh_pipeline;

    const instance_pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.shaderInstanceRenderGadgetModule.getVsEntryPoint(),
        module: this.instnaceMeshRenderShaderModule,
        buffers: this.shaderInstanceRenderGadgetModule.getVertexLayout(),
      },
      fragment: {
        entryPoint: this.shaderInstanceRenderGadgetModule.getFsEntryPoint(),
        module: this.instnaceMeshRenderShaderModule,
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
    this.instnaceMeshRenderShaderPipeline = instance_pipeline;
    return mesh_pipeline;
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
    return this.shaderLights[0];
  }

  private get ambientLightGadget() {
    return this.shaderLights[1];
  }

  private get directionalLightGadget() {
    return this.shaderLights[2];
  }

  compile() {
    this.shadowResources.update(this.shaderLights);
    this.updateBindGroupEntray();
    this.invalidateAllBindGroups();
    this.createShaderModule();
    this.settingPipeline();
  }

  private invalidateAllBindGroups() {
    this.meshs.forEach((mesh) => {
      mesh.cachedBindGroup = null;
    });
    this.instanceMesh.forEach((im) => {
      im.cachedBindGroup = null;
    });
    this.invalidateNodeBindGroups(this.nodes);
  }

  private invalidateNodeBindGroups(nodes: Node[]) {
    nodes.forEach((node) => {
      node.meshs.forEach((mesh) => {
        mesh.cachedBindGroup = null;
      });
      this.invalidateNodeBindGroups(node.children);
    });
  }

  private getLightCountSnapshot() {
    return Object.values(this.shaderLights).map((g) =>
      roundUp(formatLightCount, g.lights.length),
    );
  }

  addLight(light: Light) {
    const before = this.getLightCountSnapshot();

    if (light instanceof PointLight) {
      this.pointLightGadget.addLight(light);
    } else if (light instanceof AmbientLight) {
      this.ambientLightGadget.addLight(light);
    } else if (light instanceof DirectionalLight) {
      this.directionalLightGadget.addLight(light);
    }

    const after = this.getLightCountSnapshot();
    if (before.some((v, i) => v !== after[i])) {
      this.compile();
    } else {
      this.updateBindGroupEntray();
      this.invalidateAllBindGroups();
    }
  }

  removeLight(light: Light) {
    const before = this.getLightCountSnapshot();

    if (light instanceof PointLight) {
      const idx = this.pointLightGadget.lights.indexOf(light);
      if (idx !== -1) this.pointLightGadget.removeLight(idx);
    } else if (light instanceof AmbientLight) {
      const idx = this.ambientLightGadget.lights.indexOf(light);
      if (idx !== -1) this.ambientLightGadget.removeLight(idx);
    } else if (light instanceof DirectionalLight) {
      const idx = this.directionalLightGadget.lights.indexOf(light);
      if (idx !== -1) this.directionalLightGadget.removeLight(idx);
    }

    const after = this.getLightCountSnapshot();
    if (before.some((v, i) => v !== after[i])) {
      this.compile();
    } else {
      this.updateBindGroupEntray();
      this.invalidateAllBindGroups();
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

    this.camera.update(this.device, aspect);
    const vpMatrix = this.camera.vpMatrix!;

    // shadow 리소스 갱신 및 PV matrix 기록
    this.shadowResources.update(this.shaderLights);
    this.shadowResources.writePvMatrices(this.shaderLights);

    // shadow pass는 메인 렌더 패스 시작 전에 실행 (encoder에 pass 중첩 불가)
    this.shadowPass.createPass(encoder);

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.meshRenderShaderPipeline);
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
      const M = createModelMatrix(mesh);
      if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M)) return;
      if (mesh.dirty){
        createMatrix(mesh, this.device, mesh.matrixBuffer);
        mesh.dirty = false;
      }
      if (mesh.matrial.dirty) {
        this.device.queue.writeBuffer(
          mesh.matrialBuffer.buffer,
          0,
          mesh.matrial.getDataArray(),
        );
      }

      if (!mesh.cachedBindGroup) {
        mesh.cachedBindGroup = this.device.createBindGroup({
          layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
          entries: [
            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
            { binding: 1, resource: { buffer: this.camera.cameraBuffer!.buffer } },
            { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
            { binding: 3, resource: { buffer: this.camera.vpBuffer!.buffer } },
            { binding: 4, resource: mesh.matrial.texture?.texture.createView() ?? this.dummyTextureView },
            { binding: 5, resource: this.defaultSampler },
            ...this.lightBindGroupEntry,
          ],
        });
      }

      pass.setBindGroup(3, mesh.cachedBindGroup);
      pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
      pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
      pass.drawIndexed(mesh.geometry.indexs.length);
    });

    this.nodeRecursionRender(this.nodes, vpMatrix, pass);

    if (this.instanceMesh.length > 0) {
      pass.setPipeline(this.instnaceMeshRenderShaderPipeline);

      this.instanceMesh.forEach((instanceMesh) => {
        instanceMesh.update();
        instanceMesh.frustumCull(vpMatrix);

        if (instanceMesh.renderCount === 0) return;

        if (!instanceMesh.cachedBindGroup) {
          instanceMesh.cachedBindGroup = this.device.createBindGroup({
            layout: this.instnaceMeshRenderShaderPipeline.getBindGroupLayout(3),
            entries: [
              { binding: 0, resource: { buffer: this.camera.vpBuffer!.buffer } },
              { binding: 1, resource: { buffer: this.camera.cameraBuffer!.buffer } },
              ...this.lightBindGroupEntry,
              {
                binding: 30,
                resource: { buffer: instanceMesh.matrixBuffer.buffer },
              },
              {
                binding: 31,
                resource: { buffer: instanceMesh.matrialBuffer.buffer },
              },
            ],
          });
        }

        pass.setBindGroup(3, instanceMesh.cachedBindGroup);
        pass.setVertexBuffer(0, instanceMesh.geometry.vertexBuffer.buffer);
        pass.setIndexBuffer(instanceMesh.geometry.indexBuffer.buffer, "uint32");
        pass.drawIndexed(
          instanceMesh.geometry.indexs.length,
          instanceMesh.renderCount,
        );
      });
    }

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

        if (mesh.matrial.dirty) {
          this.device.queue.writeBuffer(
            mesh.matrialBuffer.buffer,
            0,
            mesh.matrial.getDataArray(),
          );
        }
        if (!mesh.cachedBindGroup) {
          mesh.cachedBindGroup = this.device.createBindGroup({
            layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
            entries: [
              { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
              { binding: 1, resource: { buffer: this.camera.cameraBuffer!.buffer } },
              { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
              { binding: 3, resource: { buffer: this.camera.vpBuffer!.buffer } },
              { binding: 4, resource: mesh.matrial.texture?.texture.createView() ?? this.dummyTextureView },
              { binding: 5, resource: this.defaultSampler },
              ...this.lightBindGroupEntry,
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

  updateBindGroupEntray() {
    const result: GPUBindGroupEntry[] = [];
    const lightGadgets = Object.values(this.shaderLights).sort(
      (a, b) => a.binding - b.binding,
    );
    lightGadgets.forEach((e) => {
      if (e.lights.length === 0) return;
      result.push({
        binding: e.binding,
        resource: { buffer: e.gpuBuffer.buffer },
      });
    });
    // shadow 리소스 바인딩 (20~24) 추가
    if (this.shadowResources) {
      result.push(...this.shadowResources.getBindGroupEntries());
    }
    this.lightBindGroupEntry = result;
  }
}

function isShadowGadget(gadget: ShaderLightGadget<any>): gadget is ShaderLightGadget<any> & ShadowGadget {
  return "getShadowDefinesCode" in gadget;
}
