import { Vector2, Vector3 } from "../math/vector";
import { Vertex } from "../mesh/unit/vertex";
/**
 * OBJ 파일 텍스트를 파싱하여 Vertex 배열과 인덱스 배열을 반환한다.
 * face 포맷: f v/vt/vn, f v//vn, f v/vt, f v 모두 지원.
 * 쿼드(4 vertex) face는 삼각형 2개로 분할.
 */
export function parseOBJ(text) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const vertices = [];
    const indices = [];
    // pos/uv/norm 조합 → 이미 생성된 vertex 인덱스
    const vertexMap = new Map();
    const lines = text.split("\n");
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line === "" || line.startsWith("#"))
            continue;
        const parts = line.split(/\s+/);
        const keyword = parts[0];
        if (keyword === "v") {
            positions.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3]),
            ]);
        }
        else if (keyword === "vn") {
            normals.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3]),
            ]);
        }
        else if (keyword === "vt") {
            uvs.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
            ]);
        }
        else if (keyword === "f") {
            const faceIndices = [];
            for (let i = 1; i < parts.length; i++) {
                const vertIdx = getOrCreateVertex(parts[i], positions, normals, uvs, vertexMap, vertices);
                faceIndices.push(vertIdx);
            }
            // 삼각형 팬 방식으로 분할 (3각형, 4각형, n각형 모두 처리)
            for (let i = 1; i < faceIndices.length - 1; i++) {
                indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
            }
        }
    }
    return { vertices, indices };
}
/**
 * face vertex 문자열(예: "1/2/3")을 파싱하여
 * 중복이 없으면 새 Vertex를 생성, 있으면 기존 인덱스를 반환한다.
 */
function getOrCreateVertex(faceStr, positions, normals, uvs, vertexMap, vertices) {
    const existing = vertexMap.get(faceStr);
    if (existing !== undefined)
        return existing;
    const parts = faceStr.split("/");
    // OBJ 인덱스는 1-based
    const posIdx = parseInt(parts[0]) - 1;
    const uvIdx = parts.length > 1 && parts[1] !== "" ? parseInt(parts[1]) - 1 : -1;
    const normIdx = parts.length > 2 && parts[2] !== "" ? parseInt(parts[2]) - 1 : -1;
    const pos = positions[posIdx];
    const location = new Vector3(pos[0], pos[1], pos[2]);
    let normal;
    if (normIdx >= 0 && normals[normIdx]) {
        const n = normals[normIdx];
        normal = new Vector3(n[0], n[1], n[2]);
    }
    let uv;
    if (uvIdx >= 0 && uvs[uvIdx]) {
        const t = uvs[uvIdx];
        uv = new Vector2(t[0], t[1]);
    }
    const vertex = new Vertex({ location, normal, uv });
    const index = vertices.length;
    vertices.push(vertex);
    vertexMap.set(faceStr, index);
    return index;
}
/**
 * OBJ 파일을 로드한다.
 * 입력: File, ArrayBuffer(UTF-8), 또는 텍스트 string
 */
export async function loadOBJ(input) {
    let text;
    if (typeof input === "string") {
        // URL인 경우 fetch, 아니면 직접 텍스트로 취급
        if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("/")) {
            const response = await fetch(input);
            text = await response.text();
        }
        else {
            text = input;
        }
    }
    else if (input instanceof File) {
        text = await input.text();
    }
    else {
        // ArrayBuffer
        const decoder = new TextDecoder("utf-8");
        text = decoder.decode(input);
    }
    return parseOBJ(text);
}
//# sourceMappingURL=obj_loader.js.map