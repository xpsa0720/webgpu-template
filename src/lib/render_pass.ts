import { DEBUG_MODE } from "../setting";
import type { OutGPUBuffer } from "./compute_pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";

interface RenderPassArg extends PassArg {
  canvas: HTMLCanvasElement;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  loadOp?: GPULoadOp;
}

export class RenderPass extends Pass {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  shaderModule: GPUShaderModule;
  pipeline: GPURenderPipeline;
  entries: Record<number, GPUBindingResource>;
  device: GPUDevice;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  loadOp: GPULoadOp;
  constructor(arg: RenderPassArg) {
    if (!arg.device) {
      throw Error("wp를 초기화 하십시오");
    }

    super(arg);
    const presentationFormat: GPUTextureFormat =
      navigator.gpu.getPreferredCanvasFormat();
    this.shaderCode = arg.shaderCode;
    this.canvas = arg.canvas;
    const ctx = this.canvas.getContext("webgpu");
    if (!ctx) {
      throw new Error("context을 가져 올 수 없습니다!");
    }
    this.device = arg.device;
    this.loadOp = arg.loadOp ?? "clear";
    this.context = ctx;
    this.buffers = [];
    this.entries = [];
    this.vertexCount = arg.vertexCount;
    this.instanceCount = arg.instanceCount;
    this.vertexEntryPoint = arg.vertexEntryPoint;
    this.fragmentEntryPoint = arg.fragmentEntryPoint;
    this.shaderModule = this.device.createShaderModule({
      code: this.shaderCode,
    });
    this.context.configure({
      device: this.device,
      format: presentationFormat,
    });
    const blendState: GPUBlendState | undefined =
      this.loadOp == "load"
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

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        entryPoint: this.vertexEntryPoint,
        module: this.shaderModule,
      },
      fragment: {
        entryPoint: this.fragmentEntryPoint,
        module: this.shaderModule,
        targets: [
          {
            format: presentationFormat,
            blend:blendState
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  deleteBuffer(bindigIdx: number) {
    if (!this.entries[bindigIdx]) {
      throw Error("해당 바인딩에 버퍼가 없습니다");
    }
    delete this.entries[bindigIdx];
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    const entries: Array<GPUBindGroupEntry> = [];
    for (const [key, value] of Object.entries(this.buffers)) {
      entries.push({
        binding: Number(key),
        resource: { buffer: value.buffer },
      });
    }
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: entries,
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: this.loadOp,
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };
    if (debugArg?.time && DEBUG_MODE) {
      renderPassDescriptor.timestampWrites = {
        querySet: debugArg.querySet,
        beginningOfPassWriteIndex: debugArg.time?.startIndex ?? undefined,
        endOfPassWriteIndex: debugArg.time?.endIndex ?? undefined,
      };
    }
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(
      this.vertexCount,
      this.instanceCount == 0 ? 1 : this.instanceCount,
    );
    pass.end();

    return super.createPass(encoder);
  }
}
