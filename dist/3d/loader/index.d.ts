export { loadOBJ } from "./obj_loader";
export { loadGLTF } from "./gltf_loader";
import type { Render3DPass } from "../../pass/render_3d_pass";
import type { Node } from "../node/node";
/**
 * 파일 확장자를 기반으로 적절한 로더를 호출하여 루트 Node를 반환한다.
 * 지원 형식: .obj, .gltf, .glb
 *
 * .gltf 파일은 외부 .bin 참조가 있으므로:
 * - URL로 전달하면 WebIO가 자동으로 .bin을 fetch
 * - FileList / File[]로 전달하면 .bin 파일도 함께 전달 가능
 * - 단일 File로 전달하면 .bin 누락 시 에러 발생
 * .obj 파일의 .mtl도 같은 방식 (URL 기준 상대 경로 fetch, 또는 FileList에 함께 전달)
 */
export declare function loadModel(render3DPass: Render3DPass, input: File | FileList | File[] | ArrayBuffer | string, format?: string): Promise<Node>;
//# sourceMappingURL=index.d.ts.map