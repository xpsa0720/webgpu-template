import type { OutGPUBuffer } from "../types/pass";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
interface PostProcessingPassArg extends PassArg {
    device: GPUDevice;
    target: GPUTexture | HTMLCanvasElement;
    inputTexture: GPUTexture;
    depthTexture: GPUTexture;
    fragmentCode: string;
    format?: GPUTextureFormat;
}
export declare class PostProcessingPass extends Pass {
    device: GPUDevice;
    target: GPUTexture | HTMLCanvasElement;
    context: GPUCanvasContext | null;
    format: GPUTextureFormat;
    inputTexture: GPUTexture;
    depthTexture: GPUTexture;
    private pipeline;
    private bindGroupLayout;
    private texSampler;
    constructor(arg: PostProcessingPassArg);
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
export {};
//# sourceMappingURL=postprocessing_pass.d.ts.map