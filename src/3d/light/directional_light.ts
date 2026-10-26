import { Vector4 } from "../math/vector";
import { Light, type LightParams } from "./light";

export interface DirectionalLightParams extends LightParams {
  directional?: Vector4;
}

export class DirectionalLight extends Light {
  directional: Vector4;
  constructor({ directional = new Vector4(0, -1, 0, 0), ...rest }: DirectionalLightParams = {}) {
    super(rest);
    this.directional = directional;
  }
}
