import { Vector3, Vector4 } from "../math/vector";

export interface LightParams {
  // position: Vector3;
  intensity?: number;
  color?: Vector4;
}

export class Light {
  // position: Vector3;
  intensity: number;
  color: Vector4;

  constructor({intensity, color }: LightParams) {
    // this.position = position;
    this.intensity = intensity ?? 1;
    this.color = color ?? new Vector4(1, 1, 1,1);
  }
}