
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

    const arg:GPUComputePassDescriptor = debugArg?.time && DEBUG_MODE ? {
        timestampWrites:{
            querySet: debugArg.querySet,
            beginningOfPassWriteIndex:debugArg.time?.startIndex,
            endOfPassWriteIndex:debugArg.time?.endIndex,
        }
    }:{}
    const pass = encoder.beginComputePass(arg);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.computeTargetCount / this.workgroupSize),
    );
    pass.end();
    return super.createPass(encoder);
  }
}
