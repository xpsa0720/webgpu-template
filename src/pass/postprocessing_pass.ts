import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";

const postProcessingShader = `
struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@group(0) @binding(0) var texSampler: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var depthTex: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertexOut {
    var pos = array<vec2f, 3>(
        vec2f(-1, -1),
        vec2f( 3, -1),
        vec2f(-1,  3),
    );
    var out: VertexOut;
    out.position = vec4f(pos[vi], 0, 1);
    out.uv = (pos[vi] + 1) * 0.5;
    out.uv.y = 1 - out.uv.y;
    return out;
}

@fragment
fn fs(input: VertexOut) -> @location(0) vec4f {
    @USER_CODE
    
}
`;
const DEFAULT_CODE = "return textureSample(tex, texSampler, input.uv);";

interface PostProcessingPassArg extends PassArg {
  device: GPUDevice;
  target: GPUTexture | HTMLCanvasElement;
  inputTexture: GPUTexture;
  depthTexture: GPUTexture;
  fragmentCode: string;
  format?: GPUTextureFormat;
}

export class PostProcessingPass extends Pass {
  device: GPUDevice;

  target: GPUTexture | HTMLCanvasElement;
  context: GPUCanvasContext | null;
  format: GPUTextureFormat;
  inputTexture: GPUTexture;
  depthTexture: GPUTexture;

  private pipeline: GPURenderPipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private texSampler: GPUSampler;

  constructor(arg: PostProcessingPassArg) {
    super(arg);
    this.device = arg.device;
    this.target = arg.target;
    this.inputTexture = arg.inputTexture;
    this.depthTexture = arg.depthTexture;
    this.context = null;
    if (this.target instanceof HTMLCanvasElement) {
      this.context = this.target.getContext("webgpu");
    }
    this.format =
      arg.format ??
      (this.target instanceof HTMLCanvasElement
        ? navigator.gpu.getPreferredCanvasFormat()
        : this.target.format);

    this.texSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const shaderModule = this.device.createShaderModule({
      code: postProcessingShader.replaceAll(
        "@USER_CODE",
        arg.fragmentCode ?? DEFAULT_CODE,
      ),
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "unfilterable-float", viewDimension: "2d" },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        entryPoint: "vs",
        module: shaderModule,
      },
      fragment: {
        entryPoint: "fs",
        module: shaderModule,
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
    this.bindGroupLayout = bindGroupLayout;
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    const view = this.context
      ? this.context.getCurrentTexture().createView()
      : (this.target as GPUTexture).createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    };

    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: this.texSampler },
        { binding: 1, resource: this.inputTexture.createView() },
        { binding: 2, resource: this.depthTexture.createView() },
      ],
    });

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();

    return [];
  }
}
