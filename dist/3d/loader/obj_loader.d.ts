import { Vertex } from "../mesh/unit/vertex";
export interface LoadResult {
    vertices: Vertex[];
    indices: number[];
}
/**
 * OBJ 파일 텍스트를 파싱하여 Vertex 배열과 인덱스 배열을 반환한다.
 * face 포맷: f v/vt/vn, f v//vn, f v/vt, f v 모두 지원.
 * 쿼드(4 vertex) face는 삼각형 2개로 분할.
 */
export declare function parseOBJ(text: string): LoadResult;
/**
 * OBJ 파일을 로드한다.
 * 입력: File, ArrayBuffer(UTF-8), 또는 텍스트 string
 */
export declare function loadOBJ(input: File | ArrayBuffer | string): Promise<LoadResult>;
//# sourceMappingURL=obj_loader.d.ts.map