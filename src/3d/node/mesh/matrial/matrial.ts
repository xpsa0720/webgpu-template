
import { SHADER_MATRIAL_STRUCT } from "../../../../shader/gadget/code/shader_code";
import type { WebGPUTexture } from "../../../../types/resource";
import { uniformData } from "../../../../util/uniform";
import { Vector4, type Vector3 } from "../../../math/vector";
import { Specular } from "./specular";

export interface MatrialParams {
  color: Vector3;
  opacity?: number;
  specular?: Specular;
  device?: GPUDevice;
  imageBitmap?: ImageBitmap;
}

interface MatrialUniformData {
  baseColor: Vector4;
  specualrColor: Vector4;
  specualrStrength: number;
  specualrShininess: number;
  texturFlag: number;
}

let dummyTexture: GPUTexture | null = null;

function getOrCreateDummyTexture(device: GPUDevice): GPUTexture {
  if (dummyTexture) return dummyTexture;

  dummyTexture = device.createTexture({
    size: [1, 1, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: dummyTexture },
    new Uint8Array([255, 255, 255, 255]),
    { bytesPerRow: 4 },
    [1, 1, 1],
  );

  return dummyTexture;
}

export class Matrial {
  color: Vector3;
  texture: WebGPUTexture | null = null;
  textureFlag: number = 0;
  opacity: number;
  specualr: Specular;

  constructor({ color, opacity = 1, specular = new Specular({}), device, imageBitmap }: MatrialParams) {
    this.color = color;
    this.opacity = opacity;
    this.specualr = specular;

    if (device) {
      this.texture = { texture: this.createTexture(device, imageBitmap) };
      this.textureFlag = imageBitmap ? 1 : 0;
    }
  }

  private createTexture(device: GPUDevice, imageBitmap?: ImageBitmap): GPUTexture {
    if (!imageBitmap) {
      return getOrCreateDummyTexture(device);
    }

    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
      { source: imageBitmap, flipY: false },
      { texture },
      { width: imageBitmap.width, height: imageBitmap.height },
    );

    return texture;
  }

  getColor() {
    return new Vector4(this.color.x, this.color.y, this.color.z, this.opacity);
  }
  getDataArray() {
    return uniformData<MatrialUniformData>(SHADER_MATRIAL_STRUCT, {
      baseColor: this.getColor(),
      specualrColor: this.specualr.color,
      specualrShininess: this.specualr.shininess,
      specualrStrength: this.specualr.strength,
      texturFlag: this.textureFlag,
    });
  }
}
