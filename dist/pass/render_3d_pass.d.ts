import type { Mesh } from "../3d/mesh/mesh";
import { ShaderGadgetModule } from "../shader/core/shader_module";
import { Light } from "../shader/gadget/shader_light";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
import { RenderPass, type RenderPassArg } from "./render_pass";
interface Render3DPassArg extends RenderPassArg {
    target: GPUTexture | HTMLCanvasElement;
    meshs?: Mesh[];
    camera: Camera;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
    blend?: boolean;
    debugMode?: boolean;
}
export declare class Render3DPass extends RenderPass {
    meshs: Mesh[];
    camera: Camera;
    matrixBuffer: WebGPUBuffer;
    cameraBuffer: WebGPUBuffer;
    matrialBuffer: WebGPUBuffer;
    shaderGadgetModule: ShaderGadgetModule;
    shaderModule: GPUShaderModule;
    pipeline: GPURenderPipeline;
    protected bindGroupMatrix: GPUBindGroup | null;
    private depthTexture;
    private depthWidth;
    private depthHeight;
    private lihgtUpdate;
    private lightEntries;
    constructor(arg: Render3DPassArg);
    createShaderModule(): GPUShaderModule;
    settingPipeline(): GPURenderPipeline;
    private getTargetSize;
    private getAspect;
    private get pointLightGadget();
    private get ambientLightGadget();
    private get directionalLightGadget();
    addLight(light: Light): void;
    removeLight(light: Light): any;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
}
export {};
//# sourceMappingURL=render_3d_pass.d.ts.map