import { Vector3 } from "../3d/math/vector";
import type { Mesh } from "../3d/mesh/mesh";
import type { Camera } from "../types/camera";
export declare function normalize(vec: Vector3): Vector3;
export declare function toRadian(degree: number): number;
export declare function gpuBufferSizeFormat(n: number): number;
/** WGSL 타입별 { size, alignment } */
export declare const WGSL_TYPE_INFO: Record<string, {
    size: number;
    alignment: number;
}>;
/**
 * WGSL struct 문자열로부터 실제 GPU 메모리 크기(바이트)를 계산한다.
 * 각 멤버의 alignment에 따라 offset을 정렬하고,
 * 최종 크기는 struct alignment(가장 큰 멤버 alignment)의 배수로 올림한다.
 *
 * @example
 * wgslStructSize(`struct PointLight{
 *   position: vec4f,
 *   intensity: f32,
 *   color: vec4f
 * }`) // → 48
 */
export declare function wgslStructSize(structCode: string): number;
export declare function isView(mesh: Mesh, camera: Camera, aspect: number): boolean;
export declare function distance(a: Vector3, b: Vector3): number;
//# sourceMappingURL=math.d.ts.map