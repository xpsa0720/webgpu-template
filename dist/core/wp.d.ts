import { ComputePass } from "../pass/compute_pass";
import { Render3DPass } from "../pass/render_3d_pass";
import { Render2DPass } from "../pass/render_2d_pass";
import { PostProcessingPass } from "../pass/postprocessing_pass";
import type { PassCallback } from "../types/callback";
import type { CreateComputePassArg, CreatePassTimeTag, CreateRender3DPassArg, CreateRenderPassArg } from "../types/pass";
import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "../types/resource";
import { type WPConfig } from "./config";
interface WPArg {
    canvas: HTMLCanvasElement;
    config?: WPConfig;
}
export declare class WP<B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>, T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>, S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>> {
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    adapter: GPUAdapter | null;
    device: GPUDevice | null;
    passes: Array<ComputePass | Render2DPass | Render3DPass | PostProcessingPass>;
    config: Required<WPConfig>;
    timeDebugPass: number;
    timeDebugLabels: string[];
    totalFrame: number;
    fpsFrameCount: number;
    lastFpsLogTime: number;
    fpsElement: HTMLElement | null;
    timestampElement: HTMLElement | null;
    latestTimestampLines: string[];
    debugFrameCounter: number;
    constructor(arg: WPArg);
    init(): Promise<void>;
    createComputePass(index: number, arg: CreateComputePassArg, time?: CreatePassTimeTag, encoderCallback?: (encoder: GPUCommandEncoder) => void, preEncoderCallback?: (encoder: GPUCommandEncoder) => void): ComputePass;
    createRenderPass(index: number, arg: CreateRenderPassArg, time?: CreatePassTimeTag, encoderCallback?: (encoder: GPUCommandEncoder) => void, preEncoderCallback?: (encoder: GPUCommandEncoder) => void): Render2DPass;
    createRender3DPass(index: number, arg: CreateRender3DPassArg, time?: CreatePassTimeTag, encoderCallback?: (encoder: GPUCommandEncoder) => void, preEncoderCallback?: (encoder: GPUCommandEncoder) => void): Render3DPass;
    createBuffer(size: number, data: GPUAllowSharedBufferSource, usage: GPUBufferUsageFlags): WebGPUBuffer;
    createTexture(size: GPUExtent3DDict, data: BufferSource, usage: GPUTextureUsageFlags, format?: GPUTextureFormat): WebGPUTexture;
    createTextureFromImage(url: string, usage: GPUTextureUsageFlags): Promise<WebGPUTexture>;
    createSampler(): WebGPUSampler;
    prevFrameTime: number;
    animate(arg: {
        b: B;
        callBack?: PassCallback<B>;
        substepCallback?: PassCallback<B>;
    }): Promise<void>;
    run(passes: Array<Render2DPass | Render3DPass | ComputePass | PostProcessingPass>, substep: number, buffers: B, dt: number, substepCallback?: PassCallback<B>): Promise<Record<string, Float32Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike>> | null>;
}
export {};
//# sourceMappingURL=wp.d.ts.map