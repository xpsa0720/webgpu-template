import { Vector3, Vector4 } from "../3d/math/vector";
import { createProjectionMatrix, createViewMatrix } from "./matrix";
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
// 6개 frustum 평면을 정규화된 [a,b,c,d] 형태로 추출 (객체 생성 없음)
// 반환: Float64Array(24) — 평면당 4개씩 6개
export function extractFrustumPlanes(PV) {
    const c = PV.columns;
    const r0x = c[0].x, r0y = c[1].x, r0z = c[2].x, r0w = c[3].x;
    const r1x = c[0].y, r1y = c[1].y, r1z = c[2].y, r1w = c[3].y;
    const r2x = c[0].z, r2y = c[1].z, r2z = c[2].z, r2w = c[3].z;
    const r3x = c[0].w, r3y = c[1].w, r3z = c[2].w, r3w = c[3].w;
    const planes = new Float64Array(24);
    // left:   row3 + row0
    planes[0] = r3x + r0x;
    planes[1] = r3y + r0y;
    planes[2] = r3z + r0z;
    planes[3] = r3w + r0w;
    planes[4] = r3x - r0x;
    planes[5] = r3y - r0y;
    planes[6] = r3z - r0z;
    planes[7] = r3w - r0w;
    planes[8] = r3x + r1x;
    planes[9] = r3y + r1y;
    planes[10] = r3z + r1z;
    planes[11] = r3w + r1w;
    planes[12] = r3x - r1x;
    planes[13] = r3y - r1y;
    planes[14] = r3z - r1z;
    planes[15] = r3w - r1w;
    planes[16] = r3x + r2x;
    planes[17] = r3y + r2y;
    planes[18] = r3z + r2z;
    planes[19] = r3w + r2w;
    planes[20] = r3x - r2x;
    planes[21] = r3y - r2y;
    planes[22] = r3z - r2z;
    planes[23] = r3w - r2w;
    // 정규화
    for (let i = 0; i < 6; i++) {
        const o = i * 4;
        const len = Math.sqrt(planes[o] * planes[o] +
            planes[o + 1] * planes[o + 1] +
            planes[o + 2] * planes[o + 2]);
        planes[o] /= len;
        planes[o + 1] /= len;
        planes[o + 2] /= len;
        planes[o + 3] /= len;
    }
    return planes;
}
export function isView(PV, AabbCenter, AabbRadius, M) {
    const c = M.multiplyVec4(new Vector4(AabbCenter.x, AabbCenter.y, AabbCenter.z, 1)); // 월드 중심
    const s = M.getScale();
    const radius = AabbRadius * Math.max(s.x, s.y, s.z);
    const planes = extractFrustumPlanes(PV);
    const ox = c.x;
    const oy = c.y;
    const oz = c.z;
    for (let i = 0; i < 6; i++) {
        const o = i * 4;
        const d = planes[o] * ox + planes[o + 1] * oy + planes[o + 2] * oz + planes[o + 3];
        if (d < -radius)
            return true;
    }
    return false;
}
// 인스턴스 대량 판정용: planes는 미리 추출한 것을 재사용
export function isOutsideFrustum(planes, ox, oy, oz, radius) {
    for (let i = 0; i < 6; i++) {
        const o = i * 4;
        const d = planes[o] * ox + planes[o + 1] * oy + planes[o + 2] * oz + planes[o + 3];
        if (d < -radius)
            return true;
    }
    return false;
}
export function distance(a, b) {
    const diff = a.copy();
    if (b)
        diff.subtract(b);
    return Math.sqrt(diff.x * diff.x + diff.y * diff.y + diff.z * diff.z);
}
//# sourceMappingURL=math.js.map