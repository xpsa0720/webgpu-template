import { type WPConfig } from "./setting";
import { ComputePass } from "./compute_pass";
import { RenderPass } from "./render_pass";
import type { PassCallback } from "./struct/run_callback";
import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "./struct/webgpu_buffer";
interface WPArg {
    canvas: HTMLCanvasElement;
    config?: WPConfig;
}
interface CreateComputePassArg {
    shaderCode: string;
    entryPoint: string;
    computeTargetCountX: number;
    computeTargetCountY?: number;
    computeTargetCountZ?: number;
    label?: string;
}
export interface CreatePassTimeTag {
    label?: string;
    startIndex?: number;
    endIndex?: number;
}
interface CreateRenderPassArg {
    target: GPUTexture | HTMLCanvasElement;
    shaderCode: string;
    vertexEntryPoint: string;
    fragmentEntryPoint: string;
    label?: string;
    vertexCount: number;
    instanceCount: number;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
}
export declare class WP<B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>, T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>, S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>> {
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    adapter: GPUAdapter | null;
    device: GPUDevice | null;
    passes: Array<ComputePass | RenderPass>;
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
    private createOverlayElement;
    init(): Promise<void>;
    createComputePass(index: number, arg: CreateComputePassArg, time?: CreatePassTimeTag, encoderCallback?: (encoder: GPUCommandEncoder) => void, preEncoderCallback?: (encoder: GPUCommandEncoder) => void): ComputePass;
    createRenderPass(index: number, arg: CreateRenderPassArg, time?: CreatePassTimeTag, encoderCallback?: (encoder: GPUCommandEncoder) => void, preEncoderCallback?: (encoder: GPUCommandEncoder) => void): RenderPass;
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
    run(passes: Array<RenderPass | ComputePass>, substep: number, buffers: B, dt: number, substepCallback?: PassCallback<B>): Promise<Record<string, Float32Array<ArrayBufferLike> | Uint32Array<ArrayBufferLike>> | null>;
}
export {};
//# sourceMappingURL=WP.d.ts.map