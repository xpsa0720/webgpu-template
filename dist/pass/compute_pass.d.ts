import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import { type AxisFlags } from "./workgroup_size";
export interface ComputePassArg extends PassArg {
    computeTargetCountX: number;
    computeTargetCountY?: number;
    computeTargetCountZ?: number;
    entryPoint: string;
    debugMode?: boolean;
    shaderCode: string;
}
export declare class ComputePass extends Pass {
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
    private debugMode;
    private bindGroup;
    private bindGroupTex;
    private bindGroupSampler;
    constructor(arg: ComputePassArg);
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
    private dispatchCount;
}
//# sourceMappingURL=compute_pass.d.ts.map