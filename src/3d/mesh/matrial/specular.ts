import { Vector4 } from "../../math/vector";

export interface SpecularParams {
  strength?: number;
  shininess?: number;
  color?: Vector4;
}

export class Specular {
  strength: number;
  shininess: number;
  color: Vector4;

  constructor({
    strength = 1,
    shininess = 2,
    color = new Vector4(1, 1, 1, 1),
  }: SpecularParams) {
    this.strength = strength;
    this.shininess = shininess;
    this.color = color;
  }

  getSpecualrArray() {
    return [this.strength, this.shininess, 0, 0, this.color];
  }
}
