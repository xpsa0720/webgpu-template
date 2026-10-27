import type { Mat4x4 } from "../3d/math/matrix";
import type { Node } from "../3d/node/node";
import type { LightShadow } from "../3d/shadow/lightShadow";
import { FORMAT_TABLE } from "../shader/gadget/shader_vertex";
import type { OutGPUBuffer } from "../types/pass";
import type { WebGPUBuffer } from "../types/resource";
import { gpuBufferSizeFormat, isView } from "../util/math";
import { createMatrix, createModelMatrix, createModelMatrixData } from "../util/matrix";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { Render3DPass } from "./render_3d_pass";

const shadowShader = `
struct VertexOut{
  @builtin(position) position:vec4f,
}

@group(0) @binding(0) var<uniform> mMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> vpMatrix:mat4x4<f32>;

@vertex
fn vs(@location(0) pos: vec3f) -> VertexOut {
  var out:VertexOut;
  out.position = vpMatrix * mMatrix * vec4f(pos,1);

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
  shadowShaderModule: GPUShaderModule;
  blendState: GPUBlendState | undefined;
  lightVpBuffer: WebGPUBuffer;
  mMatrixBuffer: WebGPUBuffer;
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
    this.mMatrixBuffer = {
      buffer: this.device.createBuffer({
        size: 16 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      }),
    };
    this.shadowShaderModule = this.device.createShaderModule({
      code: shadowShader,
    });
    this.settingPipeline();
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

  encoderWriteCommand(encoder: GPUCommandEncoder) {
    const shadowRes = this.render3DPass.shadowResources;

    // directional shadow 렌더링: texture array의 각 layer에 대해 패스 실행
    if (shadowRes.directionalTexture && shadowRes.directionalCount > 0) {
      let layerIdx = 0;
      for (const light of this.render3DPass.lights) {
        if (!this.isLightShadow(light)) continue;
        if (!light.castShadow) continue;
        // directional light만 필터 (LightShadow + 'directional' 속성)
        if (!("directional" in light)) continue;

        if (light.dirty) light.updateMatrix();

        this.device.queue.writeBuffer(
          this.lightVpBuffer.buffer,
          0,
          light.pvMatrix.getArrayData(),
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

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setViewport(
          0, 0,
          shadowRes.directionalTexture.width,
          shadowRes.directionalTexture.height,
          0, 1,
        );
        pass.setPipeline(this.shadowShaderPipeline);

        this.render3DPass.meshs.forEach((mesh) => {
          const mMat = createModelMatrix(mesh);
          this.device.queue.writeBuffer(
            this.mMatrixBuffer.buffer,
            0,
            mMat.getArrayData(),
          );

          const bindGroup = this.device.createBindGroup({
            layout: this.shadowShaderPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: this.mMatrixBuffer.buffer } },
              { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
            ],
          });

          pass.setBindGroup(0, bindGroup);
          pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
          pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
          pass.drawIndexed(mesh.geometry.indexs.length);
        });

        pass.end();
        layerIdx++;
      }
    }

    // point shadow 렌더링: texture array의 각 layer에 대해 패스 실행
    if (shadowRes.pointTexture && shadowRes.pointCount > 0) {
      let layerIdx = 0;
      for (const light of this.render3DPass.lights) {
        if (!this.isLightShadow(light)) continue;
        if (!light.castShadow) continue;
        // point light만 필터 (directional 속성이 없는 LightShadow)
        if ("directional" in light) continue;

        if (light.dirty) light.updateMatrix();

        this.device.queue.writeBuffer(
          this.lightVpBuffer.buffer,
          0,
          light.pvMatrix.getArrayData(),
        );

        const layerView = shadowRes.pointTexture.createView({
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

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setViewport(
          0, 0,
          shadowRes.pointTexture.width,
          shadowRes.pointTexture.height,
          0, 1,
        );
        pass.setPipeline(this.shadowShaderPipeline);

        this.render3DPass.meshs.forEach((mesh) => {
          const mMat = createModelMatrix(mesh);
          this.device.queue.writeBuffer(
            this.mMatrixBuffer.buffer,
            0,
            mMat.getArrayData(),
          );

          const bindGroup = this.device.createBindGroup({
            layout: this.shadowShaderPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: this.mMatrixBuffer.buffer } },
              { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
            ],
          });

          pass.setBindGroup(0, bindGroup);
          pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
          pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
          pass.drawIndexed(mesh.geometry.indexs.length);
        });

        pass.end();
        layerIdx++;
      }
    }
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
              { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
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

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.encoderWriteCommand(encoder);
    return [];
  }

  /**
   * shadow map depth 텍스처를 CPU로 읽어와서 콘솔에 출력.
   * 한 번만 호출하면 됨 (매 프레임 호출하면 느림).
   * 중앙 sampleSize x sampleSize 영역의 depth 값을 출력.
   */
  async readShadowMap(sampleSize: number = 8) {
    const shadowTexture = this.render3DPass.shadowResources.directionalTexture
      ?? this.render3DPass.shadowResources.pointTexture;
    if (!shadowTexture) {
      console.warn("[ShadowPass] shadow map 텍스처 없음");
      return;
    }

    const w = shadowTexture.width;
    const h = shadowTexture.height;
    // depth32float = 4 bytes per pixel
    const bytesPerRow = Math.ceil(w * 4 / 256) * 256; // 256 정렬
    const bufferSize = bytesPerRow * h;

    const readBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = this.device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: shadowTexture },
      { buffer: readBuffer, bytesPerRow, rowsPerImage: h },
      { width: w, height: h },
    );
    this.device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();
    readBuffer.destroy();

    // 중앙 영역 샘플링
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const half = Math.floor(sampleSize / 2);
    const floatsPerRow = bytesPerRow / 4;

    // 통계 + 1.0이 아닌 값 수집
    let min = Infinity, max = -Infinity;
    let nonOneCount = 0;
    const nonOnePixels: { x: number; y: number; v: number }[] = [];
    const totalPixels = w * h;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const v = data[i * floatsPerRow + j];
        if (v < min) min = v;
        if (v > max) max = v;
        if (v < 0.9999) {
          nonOneCount++;
          if (nonOnePixels.length < 20) {
            nonOnePixels.push({ x: j, y: i, v });
          }
        }
      }
    }

    console.group(`[ShadowMap] ${w}x${h} depth 분석`);
    console.log(`min: ${min.toFixed(6)}, max: ${max.toFixed(6)}`);
    console.log(`depth < 1.0 픽셀: ${nonOneCount} / ${totalPixels} (${(nonOneCount / totalPixels * 100).toFixed(2)}%)`);
    if (nonOnePixels.length > 0) {
      console.log("1.0이 아닌 픽셀 샘플 (최대 20개):");
      nonOnePixels.forEach(p => console.log(`  (${p.x}, ${p.y}) = ${p.v.toFixed(6)}`));
    } else {
      console.log("⚠ 모든 픽셀이 1.0 — shadow map에 아무것도 그려지지 않음");
    }
    console.groupEnd();
  }

  private isLightShadow(light: unknown): light is LightShadow {
    return (
      typeof (light as any).castShadow === "boolean" &&
      typeof (light as any).updateMatrix === "function"
    );
  }
}
