import { Vector4 } from "../math/vector";
import { Light } from "./light";

export interface AmbientLightParams {
  intensity?: number;
  color?: Vector4;
}

export class AmbientLight extends Light{
  constructor({intensity, color }: AmbientLightParams) {
    super({intensity,color})
  }
}