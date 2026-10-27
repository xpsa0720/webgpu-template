import type { WebGPUTexture } from "../../types/resource";
import { Vector4 } from "../math/vector";

export interface LightParams {
  intensity?: number;
  color?: Vector4;
}

export class Light {
  intensity: number;
  color: Vector4;

  constructor({
    intensity = 1,
    color = new Vector4(1, 1, 1, 1),
  }: LightParams = {}) {
    this.intensity = intensity;
    this.color = color;
  }
  

}

