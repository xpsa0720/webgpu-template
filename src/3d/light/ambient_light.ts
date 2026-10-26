import { Light, type LightParams } from "./light";

export interface AmbientLightParams extends LightParams {}

export class AmbientLight extends Light {
  constructor(params: AmbientLightParams = {}) {
    super(params);
  }
}
