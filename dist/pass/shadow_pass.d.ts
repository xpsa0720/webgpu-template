import type { OutGPUBuffer } from "../types/pass";
import type { WebGPUBuffer } from "../types/resource";
import { Pass, type DebugPassArg, type PassArg } from "./pass";
import type { Render3DPass } from "./render_3d_pass";
interface ShadowPassArg extends PassArg {
    render3DPass: Render3DPass;
    debugMode?: boolean;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
}
export declare class ShadowPass extends Pass {
    render3DPass: Render3DPass;
    device: GPUDevice;
    shadowShaderPipeline: GPURenderPipeline;
    shadowInstanceShaderPipeline: GPURenderPipeline;
    shadowShaderModule: GPUShaderModule;
    shadowInstanceShaderModule: GPUShaderModule;
    lightVpBuffer: WebGPUBuffer;
    protected debugMode: boolean;
    constructor(arg: ShadowPassArg);
    settingPipeline(): GPURenderPipeline;
    encoderWriteCommand(encoder: GPUCommandEncoder): void;
    private nodeRecursionRender;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
export {};
//# sourceMappingURL=shadow_pass.d.ts.map