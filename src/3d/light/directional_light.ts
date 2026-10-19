import { Vector3, Vector4 } from "../math/vector";
import { Light } from "./light";

export interface DirectionalLightParams {
  directional: Vector3;
  intensity?: number;
  color?: Vector4;
}

export class DirectionalLight extends Light{
  directional: Vector3;
  
  constructor({directional,intensity, color }: DirectionalLightParams) {
    super({intensity,color})
    this.directional = directional;
  }
}