import type { Mesh } from "../3d/mesh/mesh";
import type { Camera } from "../types/camera";
import type { OutGPUBuffer } from "../types/pass";
import { type VertexLayoutOptions } from "../util/vertex_layout";
import type { DebugPassArg } from "./pass";
import { RenderPass, type RenderPassArg } from "./render_pass";
interface Render3DPassArg extends RenderPassArg {
    vertexLayoutOptions?: VertexLayoutOptions;
    meshs?: Mesh[];
    camera: Camera;
}
export declare class Render3DPass extends RenderPass {
    meshs: Mesh[];
    camera: Camera;
    protected bindGroupMatrix: GPUBindGroup | null;
    private depthTexture;
    private depthWidth;
    private depthHeight;
    constructor(arg: Render3DPassArg);
    settingPipeline(arg: Render3DPassArg): GPURenderPipeline;
    private getTargetSize;
    private getAspect;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
export {};
//# sourceMappingURL=render_3d_pass.d.ts.map