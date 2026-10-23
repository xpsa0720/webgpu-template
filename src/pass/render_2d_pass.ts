import type { OutGPUBuffer } from "../types/pass";
import {
  vertexLayoutFromWGSL,
  type VertexLayoutOptions,
} from "../util/vertex_layout";
import { Pass, type DebugPassArg, type PassArg, type PassBuffer } from "./pass";
import { RenderPass, type RenderPassArg } from "./render_pass";

export interface Render2DPassArg extends RenderPassArg {
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  shaderCode: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
}

export class Render2DPass extends RenderPass {
  shaderCode: string;
  shaderModule: GPUShaderModule;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  constructor(arg: Render2DPassArg) {
    if (!arg.device) {
      throw Error("Device not initialized");
    }
    super(arg);
    this.shaderCode = arg.shaderCode;
    // this.buffers = [];
    this.vertexCount = arg.vertexCount;
    this.instanceCount = arg.instanceCount;
    this.vertexEntryPoint = arg.vertexEntryPoint;
    this.fragmentEntryPoint = arg.fragmentEntryPoint;
    this.shaderModule = this.device.createShaderModule({
      code: this.shaderCode,
    });
    this.meshRenderShaderPipeline = this.settingPipeline();
  }

  settingPipeline(shaderCode?: string): GPURenderPipeline {
    if (shaderCode) {
      this.shaderModule = this.device.createShaderModule({
        code: shaderCode,
      });
      this.shaderCode = shaderCode
    }

    const pipeline = this.device.createRenderPipeline({
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
            format: this.format,
            blend: this.blendState,
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



  encoderWriteCommand(
    encoder: GPUCommandEncoder,
    renderPassDescriptor: GPURenderPassDescriptor,
  ) {
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(this.meshRenderShaderPipeline);
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
