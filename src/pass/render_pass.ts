import type { OutGPUBuffer } from "../types/pass";
import {
  vertexLayoutFromWGSL,
  type VertexLayoutOptions,
} from "../util/vertex_layout";
import { Pass, type DebugPassArg, type PassArg, type PassBuffer } from "./pass";

export interface RenderPassArg extends PassArg {
  target: GPUTexture | HTMLCanvasElement;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
}

export abstract class RenderPass extends Pass {
  target: GPUTexture | HTMLCanvasElement;
  context: GPUCanvasContext | null;
  entries: Record<number, GPUBindingResource>;
  device: GPUDevice;
  // vertexEntryPoint: string;
  // fragmentEntryPoint: string;
  // vertexCount: GPUSize32;
  // instanceCount: GPUSize32;
  meshRenderShaderPipeline!: GPURenderPipeline;
  loadOp: GPULoadOp;
  format: GPUTextureFormat;
  blendState: GPUBlendState | undefined;
  protected debugMode: boolean;
  protected bindGroup: GPUBindGroup | null = null;
  protected bindGroupTex: GPUBindGroup | null = null;
  protected bindGroupSampler: GPUBindGroup | null = null;
  constructor(arg: RenderPassArg) {
    if (!arg.device) {
      throw Error("Device not initialized");
    }

    super(arg);
    this.debugMode = arg.debugMode ?? false;
    // this.shaderCode = arg.shaderCode;
    this.target = arg.target;
    this.context = null;
    if (this.target instanceof HTMLCanvasElement) {
      this.context = this.target.getContext("webgpu");
    }
    this.device = arg.device;
    this.loadOp = arg.loadOp ?? "clear";
    const presentationFormat: GPUTextureFormat =
      arg.format ?? navigator.gpu.getPreferredCanvasFormat();
    this.format =
      this.target instanceof HTMLCanvasElement
        ? presentationFormat
        : this.target.format;
    this.blendState = arg.blend
      ? {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        }
      : undefined;
    this.buffers = [];
    this.entries = [];
  }

  abstract settingPipeline(shaderCode?: string) :any;

  deleteBuffer(bindigIdx: number) {
    if (!this.entries[bindigIdx]) {
      throw Error("No buffer at this binding index");
    }
    delete this.entries[bindigIdx];
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

  abstract encoderWriteCommand(
    encoder: GPUCommandEncoder,
    renderPassDescriptor: GPURenderPassDescriptor,
  ) :void;

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.ensureBindGroups();

    const view = this.context
      ? this.context.getCurrentTexture().createView()
      : (this.target as GPUTexture).createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: view,
          loadOp: this.loadOp,
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };
    if (debugArg?.time && this.debugMode) {
      renderPassDescriptor.timestampWrites = {
        querySet: debugArg.querySet,
        beginningOfPassWriteIndex: debugArg.time?.startIndex ?? undefined,
        endOfPassWriteIndex: debugArg.time?.endIndex ?? undefined,
      };
    }

    this.encoderWriteCommand(encoder, renderPassDescriptor);

    return super.createPass(encoder);
  }
}
