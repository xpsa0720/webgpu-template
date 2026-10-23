export { loadOBJ } from "./obj_loader";
export type { LoadResult } from "./obj_loader";
export { loadGLTF } from "./gltf_loader";
import type { LoadResult } from "./obj_loader";
/**
 * 파일 확장자를 기반으로 적절한 로더를 호출한다.
 * 지원 형식: .obj, .gltf, .glb
 *
 * .gltf 파일은 외부 .bin 참조가 있으므로:
 * - URL로 전달하면 WebIO가 자동으로 .bin을 fetch
 * - FileList / File[]로 전달하면 .bin 파일도 함께 전달 가능
 * - 단일 File로 전달하면 .bin 누락 시 에러 발생
 */
export declare function loadModel(input: File | FileList | File[] | ArrayBuffer | string, format?: string): Promise<LoadResult>;
//# sourceMappingURL=index.d.ts.map