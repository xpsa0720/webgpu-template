import type { Mat4x4 } from "../3d/math/matrix";
import type { Node } from "../3d/node/node";
import { SHADER_MESH_MATRIX_STRUCT } from "../shader/gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIX_STRUCT } from "../shader/gadget/code/shader_instance";
import { FORMAT_TABLE } from "../shader/gadget/shader_vertex";
import type { OutGPUBuffer } from "../types/pass";
import type { WebGPUBuffer } from "../types/resource";
import { gpuBufferSizeFormat, isView } from "../util/math";
import { createModelMatrix } from "../util/matrix";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { Render3DPass } from "./render_3d_pass";

const shadowShader = `
struct VertexOut{
  @builtin(position) position:vec4f,
}

// 임시 테스트: mesh.matrixBuffer(Main Pass와 같은 Matrixs struct)를 그대로 바인딩
${SHADER_MESH_MATRIX_STRUCT}
@group(0) @binding(0) var<uniform> matrix: Matrixs;
@group(0) @binding(1) var<uniform> vpMatrix:mat4x4<f32>;

@vertex
fn vs(@location(0) pos: vec3f) -> VertexOut {
  var out:VertexOut;
  out.position = vpMatrix * matrix.modelMatrix * vec4f(pos,1);

  return out;
}

@fragment
fn fs(out: VertexOut) {}
`;

const shadowInstanceShader = `
struct VertexOut{
  @builtin(position) position:vec4f,
}

${SHADER_INSTANCE_MATRIX_STRUCT}
@group(0) @binding(0) var<storage, read> matrix: array<InstanceMatrix>;
@group(0) @binding(1) var<uniform> vpMatrix:mat4x4<f32>;

@vertex
fn vs(@location(0) pos: vec3f, @builtin(instance_index) instance_index:u32) -> VertexOut {
  var out:VertexOut;
  out.position = vpMatrix * matrix[instance_index].modelMatrix * vec4f(pos,1);

  return out;
}

@fragment
fn fs(out: VertexOut) {}
`;

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
  shadowInstanceShaderPipeline!: GPURenderPipeline;
  shadowShaderModule: GPUShaderModule;
  shadowInstanceShaderModule: GPUShaderModule;
  blendState: GPUBlendState | undefined;
  lightVpBuffer: WebGPUBuffer;
  protected debugMode: boolean;

  constructor(arg: ShadowPassArg) {
    super(arg);
    this.render3DPass = arg.render3DPass;
    this.debugMode = arg.debugMode ?? false;
    this.device = arg.device;
    this.lightVpBuffer = {
      buffer: this.device.createBuffer({
        size: 16 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.shadowShaderModule = this.device.createShaderModule({
      code: shadowShader,
    });
    this.shadowInstanceShaderModule = this.device.createShaderModule({
      code: shadowInstanceShader,
    });
    this.settingPipeline();
  }

  settingPipeline() {
    const shader_pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: "vs",
        module: this.shadowShaderModule,
        buffers: [
          {
            arrayStride: gpuBufferSizeFormat(
              FORMAT_TABLE["float32x3"].byteSize * 2 +
                FORMAT_TABLE["float32x2"].byteSize,
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
        depthBias: 2,
        depthBiasSlopeScale: 2.0,
      },
      primitive: {
        topology: "triangle-list",
        frontFace: "ccw",
        cullMode: "back",
      },
    });
    this.shadowShaderPipeline = shader_pipeline;
    const shader_instance_pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: "vs",
        module: this.shadowInstanceShaderModule,
        buffers: [
          {
            arrayStride: gpuBufferSizeFormat(
              FORMAT_TABLE["float32x3"].byteSize * 2 +
                FORMAT_TABLE["float32x2"].byteSize,
            ),
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
        ],
      },
      fragment: {
        entryPoint: "fs",
        module: this.shadowInstanceShaderModule,
        targets: [],
      },
      depthStencil: {
        format: "depth32float",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
        depthBias: 2,
        depthBiasSlopeScale: 2.0,
      },
    });
    this.shadowInstanceShaderPipeline = shader_instance_pipeline;
    return shader_pipeline;
  }

  encoderWriteCommand(encoder: GPUCommandEncoder) {
    const shadowRes = this.render3DPass.shadowResources;

    // directional shadow 렌더링
    if (shadowRes.directionalTexture && shadowRes.directionalCount > 0) {
      // 순서 = ShadowResources.getShadowLights → PV 버퍼 칸
      const dirLights = shadowRes.getShadowLights(
        this.render3DPass.shaderLights,
        "directional",
      );
      let layerIdx = 0;
      for (const light of dirLights) {
        encoder.copyBufferToBuffer(
          shadowRes.directionalPvMatrixBuffer!,
          layerIdx * 64,
          this.lightVpBuffer.buffer,
          0,
          64,
        );

        const layerView = shadowRes.directionalTexture.createView({
          dimension: "2d",
          baseArrayLayer: layerIdx,
          arrayLayerCount: 1,
        });

        const renderPassDescriptor: GPURenderPassDescriptor = {
          colorAttachments: [],
          depthStencilAttachment: {
            view: layerView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
          },
        };
        encoder.copyBufferToBuffer(
          shadowRes.directionalPvMatrixBuffer!,
          layerIdx * 64,
          this.lightVpBuffer.buffer,
          0,
          64,
        );
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(this.shadowShaderPipeline);

        this.render3DPass.meshs.forEach((mesh) => {
          if (!mesh.matrial.castShadow) return;

          const bindGroup = this.device.createBindGroup({
            layout: this.shadowShaderPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
              { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
            ],
          });

          pass.setBindGroup(0, bindGroup);
          pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
          pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
          pass.drawIndexed(mesh.geometry.indexs.length);
        });

        if (this.render3DPass.instanceMesh.length > 0) {
          pass.setPipeline(this.shadowInstanceShaderPipeline);

          this.render3DPass.instanceMesh.forEach((instanceMesh) => {
            instanceMesh.writeAll();

            if (instanceMesh.renderCount === 0) return;
            const BindGroup = this.device.createBindGroup({
              layout: this.shadowInstanceShaderPipeline.getBindGroupLayout(0),
              entries: [
                {
                  binding: 0,
                  resource: { buffer: instanceMesh.matrixBuffer.buffer },
                },
                {
                  binding: 1,
                  resource: { buffer: this.lightVpBuffer.buffer },
                },
              ],
            });
            pass.setBindGroup(0, BindGroup);
            pass.setVertexBuffer(0, instanceMesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(
              instanceMesh.geometry.indexBuffer.buffer,
              "uint32",
            );
            pass.drawIndexed(
              instanceMesh.geometry.indexs.length,
              instanceMesh.renderCount,
            );
          });
        }

        if (this.render3DPass.instanceMesh.length > 0) {
          pass.setPipeline(this.shadowShaderPipeline);
        }

        this.nodeRecursionRender(this.render3DPass.nodes, light.pvMatrix, pass);
        pass.end();
        layerIdx++;
      }
    }

    // point shadow 렌더링
    // if (shadowRes.pointTexture && shadowRes.pointCount > 0) {
    //   const pointLights = shadowRes.getShadowLights(
    //     this.render3DPass.shaderLights,
    //     "point",
    //   );
    //   let layerIdx = 0;
    //   for (const light of pointLights) {
    //     encoder.copyBufferToBuffer(
    //       shadowRes.pointPvMatrixBuffer!,
    //       layerIdx * 64,
    //       this.lightVpBuffer.buffer,
    //       0,
    //       64,
    //     );

    //     const layerView = shadowRes.pointTexture.createView({
    //       dimension: "2d",
    //       baseArrayLayer: layerIdx,
    //       arrayLayerCount: 1,
    //     });

    //     const renderPassDescriptor: GPURenderPassDescriptor = {
    //       colorAttachments: [],
    //       depthStencilAttachment: {
    //         view: layerView,
    //         depthClearValue: 1.0,
    //         depthLoadOp: "clear",
    //         depthStoreOp: "store",
    //       },
    //     };

    //     const pass = encoder.beginRenderPass(renderPassDescriptor);
    //     pass.setPipeline(this.shadowShaderPipeline);

    //     this.render3DPass.meshs.forEach((mesh) => {
    //       const bindGroup = this.device.createBindGroup({
    //         layout: this.shadowShaderPipeline.getBindGroupLayout(0),
    //         entries: [
    //           { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
    //           { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
    //         ],
    //       });

    //       pass.setBindGroup(0, bindGroup);
    //       pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
    //       pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
    //       pass.drawIndexed(mesh.geometry.indexs.length);
    //     });

    //     this.nodeRecursionRender(this.render3DPass.nodes, light.pvMatrix, pass);
    //     pass.end();
    //     layerIdx++;
    //   }
    // }
  }

  private nodeRecursionRender(
    nodes: Node[],
    vpMatrix: Mat4x4,
    pass: GPURenderPassEncoder,
  ) {
    nodes.forEach((node) => {
      node.meshs.forEach((mesh) => {
        if (!mesh.matrial.castShadow) return;
        const M = createModelMatrix(mesh).multiply(node.worldMat);
        if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M)) return;

        const bindGroup = this.device.createBindGroup({
          layout: this.shadowShaderPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
            { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
          ],
        });

        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
        pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
        pass.drawIndexed(mesh.geometry.indexs.length);
      });
      if (node.children.length > 0)
        this.nodeRecursionRender(node.children, vpMatrix, pass);
    });
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.encoderWriteCommand(encoder);
    return [];
  }
}
