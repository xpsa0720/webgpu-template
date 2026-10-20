import { RenderPass, type RenderPassArg } from "./render_pass";
export interface Render2DPassArg extends RenderPassArg {
    vertexEntryPoint: string;
    fragmentEntryPoint: string;
    shaderCode: string;
    vertexCount: GPUSize32;
    instanceCount: GPUSize32;
}
export declare class Render2DPass extends RenderPass {
    shaderCode: string;
    shaderModule: GPUShaderModule;
    vertexEntryPoint: string;
    fragmentEntryPoint: string;
    vertexCount: GPUSize32;
    instanceCount: GPUSize32;
    constructor(arg: Render2DPassArg);
    settingPipeline(shaderCode?: string): GPURenderPipeline;
    deleteBuffer(bindigIdx: number): void;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
}
//# sourceMappingURL=render_2d_pass.d.ts.map