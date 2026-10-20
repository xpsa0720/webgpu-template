import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import { resolveWorkgroupSize, type AxisFlags } from "./workgroup_size";

export interface ComputePassArg extends PassArg {
  computeTargetCountX: number;
  computeTargetCountY?: number;
  computeTargetCountZ?: number;
  entryPoint: string;
  debugMode?: boolean;
  shaderCode: string;
}

export class ComputePass extends Pass {
  workgroupSizeX: number;
  workgroupSizeY: number;
  workgroupSizeZ: number;
  autoWorkgroupSize: AxisFlags;
  shaderCode: string;
  shaderModule: GPUShaderModule;
  shaderCodeTemplate: string;
  computeTargetCountX: number;
  computeTargetCountY: number;
  computeTargetCountZ: number;
  pipeline: GPUComputePipeline;
  private debugMode: boolean;
  private bindGroup: GPUBindGroup | null = null;
  private bindGroupTex: GPUBindGroup | null = null;
  private bindGroupSampler: GPUBindGroup | null = null;
  constructor(arg: ComputePassArg) {
    const resolved = resolveWorkgroupSize(
      arg.shaderCode,
      arg.entryPoint,
      arg.label ?? "",
    );
    super({ ...arg});
    if (!arg.device) {
      throw Error("Device not initialized");
    }
    this.shaderCode = arg.shaderCode;
    this.shaderModule = this.device.createShaderModule({
      code: this.shaderCode
    })
    this.debugMode = arg.debugMode ?? false;
    this.shaderCodeTemplate = arg.shaderCode;
    this.autoWorkgroupSize = resolved.isAuto;
    [this.workgroupSizeX, this.workgroupSizeY, this.workgroupSizeZ] = resolved.sizes;
    this.computeTargetCountX = arg.computeTargetCountX;
    this.computeTargetCountY = arg.computeTargetCountY ?? 0;
    this.computeTargetCountZ = arg.computeTargetCountZ ?? 0;
    this.pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        entryPoint: arg.entryPoint,
        module: this.shaderModule,
      },
    });
  }
  
  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    this.preEncoderCallback?.(encoder);

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

    const passArg: GPUComputePassDescriptor =
      debugArg?.time && this.debugMode
        ? {
            timestampWrites: {
              querySet: debugArg.querySet,
              beginningOfPassWriteIndex: debugArg.time?.startIndex,
              endOfPassWriteIndex: debugArg.time?.endIndex,
            },
          }
        : {};
    const pass = encoder.beginComputePass(passArg);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    if (this.bindGroupTex) {
      pass.setBindGroup(1, this.bindGroupTex);
    }
    if (this.bindGroupSampler) {
      pass.setBindGroup(2, this.bindGroupSampler);
    }
    pass.dispatchWorkgroups(
      this.dispatchCount(this.computeTargetCountX, this.workgroupSizeX) ?? 0,
      this.dispatchCount(this.computeTargetCountY, this.workgroupSizeY),
      this.dispatchCount(this.computeTargetCountZ, this.workgroupSizeZ),
    );
    pass.end();
    return super.createPass(encoder);
  }

  private dispatchCount(count: number, size: number): number | undefined {
    if (count <= 0 || size === 0) return undefined;
    return Math.ceil(count / size);
  }
}
