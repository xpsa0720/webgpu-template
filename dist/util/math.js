import { Vector3 } from "../3d/math/vector";
export function normalize(vec) {
    const denominator = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    return new Vector3(vec.x / denominator, vec.y / denominator, vec.z / denominator);
}
export function toRadian(degree) {
    return (degree * Math.PI) / 180;
}
export function gpuBufferSizeFormat(n) {
    return Math.ceil(n / 4) * 4;
}
/** WGSL 타입별 { size, alignment } */
export const WGSL_TYPE_INFO = {
    f32: { size: 4, alignment: 4 },
    i32: { size: 4, alignment: 4 },
    u32: { size: 4, alignment: 4 },
    f16: { size: 2, alignment: 2 },
    vec2f: { size: 8, alignment: 8 },
    "vec2<f32>": { size: 8, alignment: 8 },
    vec2i: { size: 8, alignment: 8 },
    "vec2<i32>": { size: 8, alignment: 8 },
    vec2u: { size: 8, alignment: 8 },
    "vec2<u32>": { size: 8, alignment: 8 },
    vec2h: { size: 4, alignment: 4 },
    "vec2<f16>": { size: 4, alignment: 4 },
    vec3f: { size: 12, alignment: 16 },
    "vec3<f32>": { size: 12, alignment: 16 },
    vec3i: { size: 12, alignment: 16 },
    "vec3<i32>": { size: 12, alignment: 16 },
    vec3u: { size: 12, alignment: 16 },
    "vec3<u32>": { size: 12, alignment: 16 },
    vec3h: { size: 6, alignment: 8 },
    "vec3<f16>": { size: 6, alignment: 8 },
    vec4f: { size: 16, alignment: 16 },
    "vec4<f32>": { size: 16, alignment: 16 },
    vec4i: { size: 16, alignment: 16 },
    "vec4<i32>": { size: 16, alignment: 16 },
    vec4u: { size: 16, alignment: 16 },
    "vec4<u32>": { size: 16, alignment: 16 },
    vec4h: { size: 8, alignment: 8 },
    "vec4<f16>": { size: 8, alignment: 8 },
    "mat2x2<f32>": { size: 16, alignment: 8 },
    mat2x2f: { size: 16, alignment: 8 },
    "mat3x3<f32>": { size: 48, alignment: 16 },
    mat3x3f: { size: 48, alignment: 16 },
    "mat4x4<f32>": { size: 64, alignment: 16 },
    mat4x4f: { size: 64, alignment: 16 },
};
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
export function wgslStructSize(structCode) {
    // "struct Name { ... }" 에서 중괄호 내부 추출
    const braceMatch = structCode.match(/\{([\s\S]*)\}/);
    if (!braceMatch) {
        throw new Error(`wgslStructSize: struct 중괄호를 찾을 수 없음`);
    }
    const body = braceMatch[1];
    // 멤버 파싱: "name: type" 형태
    const members = body
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    let offset = 0;
    let structAlignment = 1;
    for (const member of members) {
        const m = member.match(/\w+\s*:\s*(.+)/);
        if (!m) {
            throw new Error(`wgslStructSize: 멤버 "${member}" 파싱 실패`);
        }
        const typeName = m[1].trim().replace(/\s+/g, "");
        const info = WGSL_TYPE_INFO[typeName];
        if (!info) {
            throw new Error(`wgslStructSize: 알 수 없는 타입 "${typeName}"`);
        }
        // struct alignment = 가장 큰 멤버 alignment
        if (info.alignment > structAlignment) {
            structAlignment = info.alignment;
        }
        // 현재 offset을 멤버 alignment에 맞춰 정렬
        offset = Math.ceil(offset / info.alignment) * info.alignment;
        offset += info.size;
    }
    // 최종 크기를 struct alignment의 배수로 올림
    return Math.ceil(offset / structAlignment) * structAlignment;
}
//# sourceMappingURL=math.js.map