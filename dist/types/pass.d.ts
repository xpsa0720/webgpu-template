import type { PrintGPUBuffer, PrintType } from "./print";
export interface CreatePassTimeTag {
    label?: string;
    startIndex?: number;
    endIndex?: number;
}
export interface CreateComputePassArg {
    shaderCode: string;
    entryPoint: string;
    computeTargetCountX: number;
    computeTargetCountY?: number;
    computeTargetCountZ?: number;
    label?: string;
}
export interface CreateRenderPassArg {
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
export interface OutGPUBuffer {
    staginigBuffer: GPUBuffer;
    label: string;
    type: PrintType;
    print?: PrintGPUBuffer;
}
//# sourceMappingURL=pass.d.ts.map