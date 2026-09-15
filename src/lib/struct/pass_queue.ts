import type { AppBuffers } from "../../shader_queue";
import type { CreatePassTimeTag, WP } from "../WP";

export type PassQueue = (arg: PassQueueArg) => void;
export interface PassQueueArg {
  wp: WP;
  b: AppBuffers;
  idx: number;
  time?: CreatePassTimeTag;
  computeTargetCount: number;
  compileVariable?: Record<string, string>;
}

export type PassRenderQueue = (arg: PassRenderQueueArg) => void;
export interface PassRenderQueueArg extends PassQueueArg {
  wp: WP;
  b: AppBuffers;
  idx: number;
  canvas: HTMLCanvasElement;
  time?: CreatePassTimeTag;
  loadOp?: GPULoadOp;
}
