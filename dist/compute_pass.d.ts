import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { PrintType } from "./struct/out_buffer_type";
import type { PrintGPUBuffer } from "./struct/print_gpu_buffer";
type AxisFlags = [boolean, boolean, boolean];
export interface ComputePassArg extends PassArg {
    computeTargetCountX: number;
    computeTargetCountY?: number;
    computeTargetCountZ?: number;
    entryPoint: string;
    debugMode?: boolean;
}
export interface OutGPUBuffer {
    staginigBuffer: GPUBuffer;
    label: string;
    type: PrintType;
    print?: PrintGPUBuffer;
}
export declare class ComputePass extends Pass {
    workgroupSizeX: number;
    workgroupSizeY: number;
    workgroupSizeZ: number;
    autoWorkgroupSize: AxisFlags;
    shaderCodeTemplate: string;
    computeTargetCountX: number;
    computeTargetCountY: number;
    computeTargetCountZ: number;
    pipeline: GPUComputePipeline;
    private debugMode;
    private bindGroup;
    private bindGroupTex;
    private bindGroupSampler;
    constructor(arg: ComputePassArg);
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
    private static findWorkgroupSizeArgs;
    private static resolveSize;
    private static applyWorkgroupSize;
    private static evalIntExpr;
    private dispatchCount;
}
export {};
//# sourceMappingURL=compute_pass.d.ts.map