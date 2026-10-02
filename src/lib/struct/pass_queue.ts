import type { AppBuffers, AppSamplers, AppTextures } from "../../shader_queue";
import type { CreatePassTimeTag, WP } from "../WP";

export type PassQueue = (arg: PassQueueArg) => void;

interface BasePassQueueArg {
  wp: WP;
  buffers: AppBuffers;
  samplers: AppSamplers;
  textures: AppTextures;
  idx: number;
  time?: CreatePassTimeTag;
  compileVariable?: Record<string, string>;
}

export interface PassQueueArg extends BasePassQueueArg {
  computeTargetCountX: number;
  computeTargetCountY?: number;
  workGroupSizeX?: number;
  workGroupSizeY?: number;
  preEncoderCallback?: (encoder: GPUCommandEncoder) => void;
}

export type PassRenderQueue = (arg: PassRenderQueueArg) => void;
export interface PassRenderQueueArg extends BasePassQueueArg {
  target: GPUTexture | HTMLCanvasElement;
  loadOp?: GPULoadOp;
  instanceCount: number;
}
