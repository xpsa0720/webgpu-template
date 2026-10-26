import { Vector3, Vector4 } from "../3d/math/vector";
import { WGSL_TYPE_INFO } from "./math";
/**
 * WGSL struct 문자열을 파싱해서 각 멤버의 offset 정보를 반환한다.
 */
export function parseStructLayout(structCode) {
    const braceMatch = structCode.match(/\{([\s\S]*)\}/);
    if (!braceMatch) {
        throw new Error(`parseStructLayout: struct 중괄호를 찾을 수 없음`);
    }
    const rawMembers = braceMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    let offset = 0;
    let structAlignment = 1;
    const members = [];
    for (const raw of rawMembers) {
        const m = raw.match(/(\w+)\s*:\s*(.+)/);
        if (!m)
            throw new Error(`parseStructLayout: 멤버 "${raw}" 파싱 실패`);
        const name = m[1];
        const type = m[2].trim().replace(/\s+/g, "");
        const info = WGSL_TYPE_INFO[type];
        if (!info)
            throw new Error(`parseStructLayout: 알 수 없는 타입 "${type}"`);
        if (info.alignment > structAlignment) {
            structAlignment = info.alignment;
        }
        offset = Math.ceil(offset / info.alignment) * info.alignment;
        members.push({
            name,
            type,
            floatOffset: offset / 4,
            floatCount: info.size / 4,
        });
        offset += info.size;
    }
    const size = Math.ceil(offset / structAlignment) * structAlignment;
    return { size, floatLength: size / 4, members };
}
/** 값을 float 배열로 변환. Vector3/Vector4는 array() 메서드 사용 */
function valueToFloats(value) {
    if (typeof value === "number")
        return [value];
    if (value instanceof Vector4)
        return value.array();
    if (value instanceof Vector3)
        return value.array();
    throw new Error(`uniformData: 변환할 수 없는 값 타입`);
}
export function uniformData(structCode, data) {
    const layout = parseStructLayout(structCode);
    const buffer = new ArrayBuffer(layout.size);
    const floatView = new Float32Array(buffer);
    const uint32View = new Uint32Array(buffer);
    const int32View = new Int32Array(buffer);
    for (const member of layout.members) {
        const value = data[member.name];
        if (value === undefined) {
            throw new Error(`uniformData: struct 멤버 "${member.name}"에 대응하는 데이터가 없음`);
        }
        if (member.type === "u32" && typeof value === "number") {
            uint32View[member.floatOffset] = value;
        }
        else if (member.type === "i32" && typeof value === "number") {
            int32View[member.floatOffset] = value;
        }
        else {
            const floats = valueToFloats(value);
            floatView.set(floats, member.floatOffset);
        }
    }
    return floatView;
}
export function uniformDataArray(structCode, dataList) {
    const layout = parseStructLayout(structCode);
    const result = new Float32Array(layout.floatLength * dataList.length);
    for (let i = 0; i < dataList.length; i++) {
        const single = uniformData(structCode, dataList[i]);
        result.set(single, i * layout.floatLength);
    }
    return result;
}
//# sourceMappingURL=uniform.js.map