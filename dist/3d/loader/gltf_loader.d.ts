import type { LoadResult } from "./obj_loader";
/**
 * glTF/GLB 파일을 파싱하여 Vertex 배열과 인덱스 배열을 반환한다.
 * 여러 mesh/primitive가 있으면 하나의 배열로 합친다.
 *
 * 입력 형태:
 * - string: URL (.gltf/.glb) — WebIO가 .bin 등 외부 리소스를 자동 fetch
 * - ArrayBuffer: GLB 바이너리
 * - File: 단일 .glb 파일
 * - FileList / File[]: .gltf + .bin + 텍스처 파일들을 함께 전달
 */
export declare function loadGLTF(input: File | FileList | File[] | ArrayBuffer | string): Promise<LoadResult>;
//# sourceMappingURL=gltf_loader.d.ts.map