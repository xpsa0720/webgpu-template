import { Vector4 } from "../math/vector";
import { Light, type LightParams } from "./light";

export interface PointLightParams extends LightParams {
  position?: Vector4;
}

export class PointLight extends Light {
  position: Vector4;
  constructor({ position = new Vector4(0, 0, 0, 1), ...rest }: PointLightParams = {}) {
    super(rest);
    this.position = position;
  }
}
