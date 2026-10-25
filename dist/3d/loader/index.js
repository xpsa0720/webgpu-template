export { loadOBJ } from "./obj_loader";
export { loadGLTF } from "./gltf_loader";
import { loadOBJ } from "./obj_loader";
import { loadGLTF } from "./gltf_loader";
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
export async function loadModel(render3DPass, input, format) {
    const ext = format ?? detectFormat(input);
    switch (ext) {
        case "obj":
            if (input instanceof FileList || Array.isArray(input)) {
                const files = Array.from(input);
                const mainFile = files.find((f) => f.name.toLowerCase().endsWith(".obj"));
                if (!mainFile)
                    throw new Error("OBJ 파일을 찾을 수 없습니다.");
                return loadOBJ(render3DPass, mainFile, files);
            }
            return loadOBJ(render3DPass, input);
        case "gltf":
        case "glb":
            return loadGLTF(render3DPass, input);
        default:
            throw new Error(`지원하지 않는 3D 모델 형식: ${ext}`);
    }
}
/**
 * 입력에서 파일 확장자를 추출한다.
 */
function detectFormat(input) {
    if (input instanceof File) {
        return getExtension(input.name);
    }
    // FileList / File[]
    if (input instanceof FileList || Array.isArray(input)) {
        const files = Array.from(input);
        for (const f of files) {
            const ext = getExtensionSafe(f.name);
            if (ext === "gltf" || ext === "glb" || ext === "obj")
                return ext;
        }
        throw new Error("지원되는 3D 모델 파일을 찾을 수 없습니다. (.obj, .gltf, .glb)");
    }
    if (typeof input === "string") {
        const pathname = input.split("?")[0];
        return getExtension(pathname);
    }
    // ArrayBuffer의 경우 GLB magic number 확인
    if (input instanceof ArrayBuffer && input.byteLength >= 4) {
        const magic = new Uint32Array(input.slice(0, 4))[0];
        if (magic === 0x46546C67)
            return "glb";
    }
    throw new Error("파일 형식을 자동 감지할 수 없습니다. format 인자를 지정해주세요.");
}
function getExtension(filename) {
    const dot = filename.lastIndexOf(".");
    if (dot === -1)
        throw new Error("파일 확장자를 감지할 수 없습니다.");
    return filename.slice(dot + 1).toLowerCase();
}
function getExtensionSafe(filename) {
    const dot = filename.lastIndexOf(".");
    if (dot === -1)
        return null;
    return filename.slice(dot + 1).toLowerCase();
}
//# sourceMappingURL=index.js.map