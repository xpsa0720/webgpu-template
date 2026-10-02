import { DEBUG_MODE } from "../setting";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { PrintType } from "./struct/out_buffer_type";
import type { PrintGPUBuffer } from "./struct/print_gpu_buffer";

export interface ComputePassArg extends PassArg {
  workgroupSize: number;
  computeTargetCountX: number;
  computeTargetCountY?: number;
  entryPoint: string;
}

export interface OutGPUBuffer {
  staginigBuffer: GPUBuffer;
  label: string;
  type: PrintType;
  print?: PrintGPUBuffer;
}

export class ComputePass extends Pass {
  workgroupSize: number;
  computeTargetCountX: number;
  computeTargetCountY: number;
  pipeline: GPUComputePipeline;
  // 바인딩 대상(버퍼/텍스처/샘플러)이 프레임마다 안 바뀌므로, 바인드그룹은
  // 첫 createPass() 때 한 번만 만들어서 재사용한다 (매 프레임 재생성은 순수 낭비)
  private bindGroup: GPUBindGroup | null = null;
  private bindGroupTex: GPUBindGroup | null = null;
  private bindGroupSampler: GPUBindGroup | null = null;
  constructor(arg: ComputePassArg) {
    super(arg);
    if (!arg.device) {
      throw Error("wp를 초기화 하십시오");
    }
    this.workgroupSize = arg.workgroupSize;
    this.computeTargetCountX = arg.computeTargetCountX;
    this.computeTargetCountY = arg.computeTargetCountY ?? 0;
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
    // if(!debugArg && DEBUG_MODE){
    //     throw new Error("디버그 인자가 없습니다!")
    // }
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
      debugArg?.time && DEBUG_MODE
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
      Math.ceil(this.computeTargetCountX / this.workgroupSize),
      this.computeTargetCountY > 0
        ? Math.ceil(this.computeTargetCountY / this.workgroupSize)
        : undefined,
    );
    pass.end();
    return super.createPass(encoder);
  }
}
