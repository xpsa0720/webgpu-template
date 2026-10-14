import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "./resource";
import type { WP } from "../core/wp";
import type { CreatePassTimeTag } from "./pass";

export type PassQueue<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>,
> = (arg: PassQueueArg<B, T, S>) => void;

interface BasePassQueueArg<
  B extends Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler>,
> {
  wp: WP<B, T, S>;
  buffers: B;
  samplers: S;
  textures: T;
  idx: number;
  time?: CreatePassTimeTag;
  compileVariable?: Record<string, string>;
}

export interface PassQueueArg<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>,
> extends BasePassQueueArg<B, T, S> {
  computeTargetCountX: number;
  computeTargetCountY?: number;
  workGroupSizeX?: number;
  workGroupSizeY?: number;
  preEncoderCallback?: (encoder: GPUCommandEncoder) => void;
}

export type PassRenderQueue<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>,
> = (arg: PassRenderQueueArg<B, T, S>) => void;

export interface PassRenderQueueArg<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>,
> extends BasePassQueueArg<B, T, S> {
  target: GPUTexture | HTMLCanvasElement;
  loadOp?: GPULoadOp;
  instanceCount: number;
}
