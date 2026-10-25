
import { SHADER_MATRIAL_STRUCT } from "../../../../shader/gadget/code/shader_code";
import { uniformData } from "../../../../util/uniform";
import { Vector4, type Vector3 } from "../../../math/vector";
import { Specular } from "./specular";

export interface MatrialParams {
  color: Vector3;
  opacity?: number;
  specular?: Specular;
}

interface MatrialUniformData {
  baseColor: Vector4;
  specualrColor: Vector4;
  specualrStrength: number;
  specualrShininess: number;
}

export class Matrial {
  color: Vector3;
  opacity: number;
  specualr: Specular;

  constructor({ color, opacity = 1, specular = new Specular({}) }: MatrialParams) {
    this.color = color;
    this.opacity = opacity;
    this.specualr = specular;
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
    });
  }
}
