import type { Render3DPass } from "../../pass/render_3d_pass";
import type { Geometry } from "../node/mesh/geometry/geometry";
import { Matrial } from "../node/mesh/matrial/matrial";
import { Mesh } from "../node/mesh/mesh";
/** 파일에 재질 정보가 없을 때 쓰는 기본 재질 (회색) */
export declare function createDefaultMatrial(): Matrial;
/** 로더가 만드는 Mesh는 transform을 Node가 담당하므로 로컬 transform은 항등 */
export declare function createLoadedMesh(render3DPass: Render3DPass, geometry: Geometry, matrial: Matrial): Mesh;
/** URL로 취급할 문자열인지 (그 외 문자열은 파일 내용 텍스트로 취급) */
export declare function isURL(input: string): boolean;
//# sourceMappingURL=common.d.ts.map