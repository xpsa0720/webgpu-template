import type { Render3DPass } from "../../pass/render_3d_pass";
import { Matrial } from "../node/mesh/matrial/matrial";
import { Vertex } from "../node/mesh/unit/vertex";
import { Node } from "../node/node";
/** usemtl 하나에 해당하는 면 묶음 (= Mesh 하나) */
interface OBJGroup {
    matrialName: string | null;
    vertices: Vertex[];
    indices: number[];
    vertexMap: Map<string, number>;
}
export interface ParsedOBJ {
    mtllibs: string[];
    groups: OBJGroup[];
}
/**
 * OBJ 파일 텍스트를 파싱하여 usemtl 단위로 나눈 Vertex/인덱스 배열을 반환한다.
 * face 포맷: f v/vt/vn, f v//vn, f v/vt, f v 모두 지원.
 * n각형 face는 삼각형 팬으로 분할.
 */
export declare function parseOBJ(text: string): ParsedOBJ;
/**
 * MTL 파일 텍스트를 파싱하여 재질 이름 → Matrial 맵을 반환한다.
 * 지원: Kd(기본색), d / Tr(투명도), Ks(specular 색), Ns(shininess)
 */
export declare function parseMTL(text: string): Map<string, Matrial>;
/**
 * OBJ 파일을 로드하여 루트 Node를 반환한다.
 * usemtl 단위로 Mesh를 나눠 루트 Node의 meshs에 넣는다.
 *
 * 입력: File, ArrayBuffer(UTF-8), URL string, 또는 OBJ 텍스트 string
 * companions: .mtl 등 함께 전달된 파일 (드래그 앤 드롭 시)
 */
export declare function loadOBJ(render3DPass: Render3DPass, input: File | ArrayBuffer | string, companions?: File[]): Promise<Node>;
export {};
//# sourceMappingURL=obj_loader.d.ts.map