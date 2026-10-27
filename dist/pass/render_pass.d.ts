import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
export interface RenderPassArg extends PassArg {
    target: GPUTexture | HTMLCanvasElement;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
    blend?: boolean;
    debugMode?: boolean;
}
export declare abstract class RenderPass extends Pass {
    target: GPUTexture | HTMLCanvasElement;
    context: GPUCanvasContext | null;
    entries: Record<number, GPUBindingResource>;
    device: GPUDevice;
    meshRenderShaderPipeline: GPURenderPipeline;
    loadOp: GPULoadOp;
    format: GPUTextureFormat;
    blendState: GPUBlendState | undefined;
    protected debugMode: boolean;
    protected bindGroup: GPUBindGroup | null;
    protected bindGroupTex: GPUBindGroup | null;
    protected bindGroupSampler: GPUBindGroup | null;
    constructor(arg: RenderPassArg);
    abstract settingPipeline(shaderCode?: string): any;
    abstract encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    deleteBuffer(bindigIdx: number): void;
    ensureBindGroups(): void;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
//# sourceMappingURL=render_pass.d.ts.map