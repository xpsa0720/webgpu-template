import { DEBUG_MODE } from "../setting";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { PrintType } from "./struct/out_buffer_type";
import type { PrintGPUBuffer } from "./struct/print_gpu_buffer";

export interface ComputePassArg extends PassArg {
  workgroupSize: number;
  computeTargetCount: number;
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
  computeTargetCount: number;
  pipeline: GPUComputePipeline;
  constructor(arg: ComputePassArg) {
    super(arg);
    if (!arg.device) {
      throw Error("wp를 초기화 하십시오");
    }
    this.workgroupSize = arg.workgroupSize;
    this.computeTargetCount = arg.computeTargetCount;
    this.pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        entryPoint: arg.entryPoint,
        module: this.shaderModule,
      },
    });
  }

  override createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    // if(!debugArg && DEBUG_MODE){
    //     throw new Error("디버그 인자가 없습니다!")
    // }
    const entries: Array<GPUBindGroupEntry> = [];
    const entries_tex: Array<GPUBindGroupEntry> = [];
    const entries_sampler: Array<GPUBindGroupEntry> = [];
    for (const [key, value] of Object.entries(this.buffers)) {
      entries.push({
        binding: Number(key),
        resource: { buffer: value.buffer },
      });
    }
    for (const [key, value] of Object.entries(this.textures)) {
      entries_tex.push({
        binding: Number(key),
        resource: value.texture.createView(),
      });
    }
    for (const [key, value] of Object.entries(this.sampler)) {
      entries_sampler.push({
        binding: Number(key),
        resource: value.sampler,
      });
    }

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: entries,
    });

    const arg: GPUComputePassDescriptor =
      debugArg?.time && DEBUG_MODE
        ? {
            timestampWrites: {
              querySet: debugArg.querySet,
              beginningOfPassWriteIndex: debugArg.time?.startIndex,
              endOfPassWriteIndex: debugArg.time?.endIndex,
            },
          }
        : {};
    const pass = encoder.beginComputePass(arg);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    if (Object.keys(this.textures).length > 0) {
      const bindGroup_tex = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(1),
        entries: entries_tex,
      });
      pass.setBindGroup(1, bindGroup_tex);
    }
    if (Object.keys(this.sampler).length > 0) {
      const bindGroup_sam = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(2),
        entries: entries_sampler,
      });
      pass.setBindGroup(2, bindGroup_sam);
    }
    pass.dispatchWorkgroups(
      Math.ceil(this.computeTargetCount / this.workgroupSize),
    );
    pass.end();
    return super.createPass(encoder);
  }
}
