import { Vector3 } from "../3d/math/vector";

export function normalize(vec: Vector3) {
  const denominator = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

  return new Vector3(
    vec.x / denominator,
    vec.y / denominator,
    vec.z / denominator,
  );
}

export function toRadian(degree:number){
  return degree*180/Math.PI;
}