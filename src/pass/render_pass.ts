import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg, type PassBuffer } from "./pass";

interface RenderPassArg extends PassArg {
  target: GPUTexture | HTMLCanvasElement;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
}

export class RenderPass extends Pass {
  target: GPUTexture | HTMLCanvasElement;
  context: GPUCanvasContext | null;
  shaderModule: GPUShaderModule;
  pipeline: GPURenderPipeline;
  entries: Record<number, GPUBindingResource>;
  device: GPUDevice;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  loadOp: GPULoadOp;
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
    this.shaderCode = arg.shaderCode;
    this.target = arg.target;
    this.context = null;
    if (this.target instanceof HTMLCanvasElement) {
      this.context = this.target.getContext("webgpu");
    }
    this.device = arg.device;
    this.loadOp = arg.loadOp ?? "clear";
    this.buffers = [];
    this.entries = [];
    this.vertexCount = arg.vertexCount;
    this.instanceCount = arg.instanceCount;
    this.vertexEntryPoint = arg.vertexEntryPoint;
    this.fragmentEntryPoint = arg.fragmentEntryPoint;
    this.shaderModule = this.device.createShaderModule({
      code: this.shaderCode,
    });
        const presentationFormat: GPUTextureFormat =
      arg.format ?? navigator.gpu.getPreferredCanvasFormat();
    const blendState: GPUBlendState | undefined =
      arg.blend
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
    const format =
      this.target instanceof HTMLCanvasElement
        ? presentationFormat
        : this.target.format;
    this.pipeline = this.settingPipeline(blendState,format);
  }

  settingPipeline(blendState:GPUBlendState | undefined,format:GPUTextureFormat):GPURenderPipeline{
    const pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.vertexEntryPoint,
        module: this.shaderModule,
        buffers: [
            {
            arrayStride: 6 * 4, // float32 6개 (pos3 + color3)
            attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },// position
                { shaderLocation: 1, offset: 3 * 4, format: "float32x3" }, // color
            ],
            },
        ],
      },
      fragment: {
        entryPoint: this.fragmentEntryPoint,
        module: this.shaderModule,
        targets: [
          {
            format: format,
            blend: blendState,
          },
        ],
        
      },
      primitive: {
        topology: "triangle-list",
      },
    });
    return pipeline;
  }

  deleteBuffer(bindigIdx: number) {
    if (!this.entries[bindigIdx]) {
      throw Error("No buffer at this binding index");
    }
    delete this.entries[bindigIdx];
  }


  ensureBindGroups(){
    if (!this.bindGroup) {
      const entries: Array<GPUBindGroupEntry> = [];
      for (const [key, value] of Object.entries(this.buffers)) {
        entries.push({
          binding: Number(key),
          resource: { buffer: value.buffer },
        });
      }
      this.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
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
        layout: this.pipeline.getBindGroupLayout(1),
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
        layout: this.pipeline.getBindGroupLayout(2),
        entries: entries_sampler,
      });
    }
  }

  encoderWriteCommand(encoder: GPUCommandEncoder,renderPassDescriptor:GPURenderPassDescriptor){
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    if (this.bindGroupTex) {
      pass.setBindGroup(1, this.bindGroupTex);
    }
    if (this.bindGroupSampler) {
      pass.setBindGroup(2, this.bindGroupSampler);
    }
    pass.draw(
      this.vertexCount,
      this.instanceCount == 0 ? 1 : this.instanceCount,
    );
    pass.end();
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.ensureBindGroups()

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
    
    this.encoderWriteCommand(encoder,renderPassDescriptor)

    return super.createPass(encoder);
  }
}
