import type { Mesh } from "../3d/node/mesh/mesh";
import type { VertexLayoutOptions } from "../util/vertex_layout";
import type { Camera } from "./camera";
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

export interface CreateRender3DPassArg {
  target: GPUTexture | HTMLCanvasElement;
  label?: string;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
  debugViewShaderCode?: boolean;
  camera: Camera;
  meshs?: Mesh[];
}

export interface OutGPUBuffer {
  staginigBuffer: GPUBuffer;
  label: string;
  type: PrintType;
  print?: PrintGPUBuffer;
}
