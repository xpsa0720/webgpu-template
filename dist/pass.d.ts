import type { OutGPUBuffer } from "./compute_pass";
import type { PrintType } from "./struct/out_buffer_type";
import type { PrintGPUBuffer } from "./struct/print_gpu_buffer";
import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "./struct/webgpu_buffer";
import type { CreatePassTimeTag } from "./WP";
export interface PassArg {
    device: GPUDevice;
    shaderCode: string;
    label?: string;
    time?: CreatePassTimeTag;
    encoderCallback?: EncoderCallback;
    preEncoderCallback?: EncoderCallback;
}
export interface PassBuffer extends WebGPUBuffer {
    isPrint: boolean;
    label: string;
    type: PrintType;
    print?: PrintGPUBuffer;
}
export interface PassTexture extends WebGPUTexture {
    label: string;
}
export interface PassSampler extends WebGPUSampler {
    label: string;
}
interface WriteBufferArg {
    bindigIdx: number;
    bufferObj: WebGPUBuffer;
    isPrint?: boolean;
    print?: PrintGPUBuffer;
    label?: string;
    type?: PrintType;
}
interface WriteTextureArg {
    bindigIdx: number;
    textureObj: WebGPUTexture;
    label?: string;
}
interface WriteSamplerArg {
    bindigIdx: number;
    samplerObj: WebGPUSampler;
    label?: string;
}
export interface DebugPassArg {
    querySet: GPUQuerySet;
    time?: CreatePassTimeTag;
}
export type EncoderCallback = (encoder: GPUCommandEncoder) => void;
export declare class Pass {
    buffers: Record<number, PassBuffer>;
    textures: Record<number, PassTexture>;
    sampler: Record<number, PassSampler>;
    shaderCode: string;
    shaderModule: GPUShaderModule;
    device: GPUDevice;
    label: string;
    time?: CreatePassTimeTag;
    encoderCallback?: EncoderCallback;
    preEncoderCallback?: EncoderCallback;
    constructor(arg: PassArg);
    writeBuffer(bindingBuffers: WriteBufferArg[]): void;
    writeTexture(bindingTextures: WriteTextureArg[]): void;
    writeSampler(bindingSampler: WriteSamplerArg[]): void;
    deleteBuffer(bindigIdx: number): void;
    createPass(encoder: GPUCommandEncoder, debugArg?: DebugPassArg): OutGPUBuffer[];
}
export {};
//# sourceMappingURL=pass.d.ts.map