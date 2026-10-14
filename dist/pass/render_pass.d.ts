import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
interface RenderPassArg extends PassArg {
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
    private debugMode;
    private bindGroup;
    private bindGroupTex;
    private bindGroupSampler;
    constructor(arg: RenderPassArg);
    deleteBuffer(bindigIdx: number): void;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
export {};
//# sourceMappingURL=render_pass.d.ts.map