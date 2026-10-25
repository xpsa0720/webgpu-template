import type { Render3DPass } from "../../pass/render_3d_pass";
import { Node } from "../node/node";
/**
 * glTF/GLB 파일을 로드하여 루트 Node를 반환한다.
 * glTF 노드 계층을 그대로 Node 트리로 만들고, primitive 하나당 Mesh 하나를 만든다.
 *
 * 입력 형태:
 * - string: URL (.gltf/.glb) — WebIO가 .bin 등 외부 리소스를 자동 fetch
 * - ArrayBuffer: GLB 바이너리
 * - File: 단일 .glb 파일
 * - FileList / File[]: .gltf + .bin + 텍스처 파일들을 함께 전달
 */
export declare function loadGLTF(render3DPass: Render3DPass, input: File | FileList | File[] | ArrayBuffer | string): Promise<Node>;
//# sourceMappingURL=gltf_loader.d.ts.map