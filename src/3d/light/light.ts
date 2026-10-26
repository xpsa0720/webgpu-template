import type { WebGPUTexture } from "../../types/resource";
import { Vector4 } from "../math/vector";

export interface LightParams {
  intensity?: number;
  color?: Vector4;
}

export class Light {
  intensity: number;
  color: Vector4;
  castShadow: boolean = false;
  shadowMap?: WebGPUTexture;
  shadowMapSize: number = 2048;
  constructor({
    intensity = 1,
    color = new Vector4(1, 1, 1, 1),
  }: LightParams = {}) {
    this.intensity = intensity;
    this.color = color;
  }
  
  createShadowMap(device: GPUDevice) {
    this.shadowMap?.texture.destroy();
    this.shadowMap = {
      texture: device.createTexture({
        size: [this.shadowMapSize, this.shadowMapSize],
        format: "depth32float",
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | // Shadow Pass에서 깊이를 씀
          GPUTextureUsage.TEXTURE_BINDING, // Main Pass에서 읽음
      }),
    };
  }
}
