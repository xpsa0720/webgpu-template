import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
export interface RenderPassArg extends PassArg {
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
export declare class RenderPass extends Pass {
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
    format: GPUTextureFormat;
    blendState: GPUBlendState | undefined;
    protected debugMode: boolean;
    protected bindGroup: GPUBindGroup | null;
    protected bindGroupTex: GPUBindGroup | null;
    protected bindGroupSampler: GPUBindGroup | null;
    constructor(arg: RenderPassArg);
    settingPipeline(arg: RenderPassArg): GPURenderPipeline;
    deleteBuffer(bindigIdx: number): void;
    ensureBindGroups(): void;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
//# sourceMappingURL=render_pass.d.ts.map