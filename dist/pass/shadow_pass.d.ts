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
    shadowShaderModule: GPUShaderModule;
    blendState: GPUBlendState | undefined;
    lightVpBuffer: WebGPUBuffer;
    mMatrixBuffer: WebGPUBuffer;
    protected debugMode: boolean;
    constructor(arg: ShadowPassArg);
    settingPipeline(): GPURenderPipeline;
    encoderWriteCommand(encoder: GPUCommandEncoder): void;
    private nodeRecursionRender;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
    /**
     * shadow map depth 텍스처를 CPU로 읽어와서 콘솔에 출력.
     * 한 번만 호출하면 됨 (매 프레임 호출하면 느림).
     * 중앙 sampleSize x sampleSize 영역의 depth 값을 출력.
     */
    readShadowMap(sampleSize?: number): Promise<void>;
    private isLightShadow;
}
export {};
//# sourceMappingURL=shadow_pass.d.ts.map