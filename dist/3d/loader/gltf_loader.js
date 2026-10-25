import { WebIO, Logger, Primitive, } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { quaternionToEuler } from "../../util/matrix";
import { Vector2, Vector3 } from "../math/vector";
import { Geometry } from "../node/mesh/geometry/geometry";
import { Matrial } from "../node/mesh/matrial/matrial";
import { Vertex } from "../node/mesh/unit/vertex";
import { Node } from "../node/node";
import { createDefaultMatrial, createLoadedMesh, isURL } from "./common";
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
export async function loadGLTF(render3DPass, input) {
    const doc = await readDocument(input);
    return buildNodeTree(render3DPass, doc);
}
async function readDocument(input) {
    const io = new WebIO()
        .setLogger(new Logger(Logger.Verbosity.ERROR))
        .registerExtensions(ALL_EXTENSIONS);
    // URL → WebIO.read()로 직접 로드 (외부 리소스 자동 fetch)
    if (typeof input === "string") {
        if (isURL(input))
            return io.read(input);
        throw new Error("glTF 로더는 URL 또는 ArrayBuffer/File만 지원합니다.");
    }
    // ArrayBuffer → GLB로 처리
    if (input instanceof ArrayBuffer) {
        return io.readBinary(new Uint8Array(input));
    }
    // FileList / File[] → 여러 파일 처리
    const files = input instanceof File ? [input] : Array.from(input);
    // .gltf 또는 .glb 메인 파일 찾기
    const mainFile = files.find((f) => f.name.toLowerCase().endsWith(".gltf") || f.name.toLowerCase().endsWith(".glb"));
    if (!mainFile) {
        throw new Error("glTF/GLB 파일을 찾을 수 없습니다.");
    }
    const mainBuffer = await mainFile.arrayBuffer();
    // .glb → 단독으로 readBinary
    if (mainFile.name.toLowerCase().endsWith(".glb")) {
        return io.readBinary(new Uint8Array(mainBuffer));
    }
    // .gltf → JSON 파싱 + 동반 파일(.bin, 텍스처)을 resources로 매핑
    const json = JSON.parse(new TextDecoder("utf-8").decode(mainBuffer));
    const resources = {};
    for (const file of files) {
        if (file === mainFile)
            continue;
        resources[file.name] = new Uint8Array(await file.arrayBuffer());
    }
    return io.readJSON({ json, resources });
}
/**
 * Document의 기본 Scene(없으면 부모가 없는 노드들)을 루트 Node 아래에 붙인다.
 * 같은 glTF material / primitive는 Matrial / Geometry를 공유한다.
 */
function buildNodeTree(render3DPass, doc) {
    const root = doc.getRoot();
    const scene = root.getDefaultScene() ?? root.listScenes()[0] ?? null;
    const topNodes = scene
        ? scene.listChildren()
        : root.listNodes().filter((n) => n.getParentNode() === null);
    const matrialCache = new Map();
    const geometryCache = new Map();
    const getMatrial = (material) => {
        let matrial = matrialCache.get(material);
        if (!matrial) {
            if (material) {
                const [r, g, b, a] = material.getBaseColorFactor();
                matrial = new Matrial({ color: new Vector3(r, g, b), opacity: a });
            }
            else {
                matrial = createDefaultMatrial();
            }
            matrialCache.set(material, matrial);
        }
        return matrial;
    };
    const getGeometry = (primitive) => {
        if (!geometryCache.has(primitive)) {
            geometryCache.set(primitive, createGeometry(render3DPass, primitive));
        }
        return geometryCache.get(primitive);
    };
    const convertNode = (gltfNode) => {
        const meshs = [];
        for (const primitive of gltfNode.getMesh()?.listPrimitives() ?? []) {
            const geometry = getGeometry(primitive);
            if (!geometry)
                continue;
            meshs.push(createLoadedMesh(render3DPass, geometry, getMatrial(primitive.getMaterial())));
        }
        const [tx, ty, tz] = gltfNode.getTranslation();
        const [sx, sy, sz] = gltfNode.getScale();
        const node = new Node({
            render3DPass,
            location: new Vector3(tx, ty, tz),
            rotate: quaternionToEuler(gltfNode.getRotation()),
            scale: new Vector3(sx, sy, sz),
            meshs,
        });
        gltfNode.listChildren().forEach((child) => node.addChild(convertNode(child)));
        return node;
    };
    const rootNode = new Node({ render3DPass, location: new Vector3(0, 0, 0) });
    topNodes.forEach((n) => rootNode.addChild(convertNode(n)));
    return rootNode;
}
/**
 * primitive 하나에서 Vertex + index 배열을 추출해 Geometry를 만든다.
 * 삼각형이 아닌 primitive(선, 점)나 POSITION이 없는 primitive는 null.
 */
function createGeometry(render3DPass, primitive) {
    if (primitive.getMode() !== Primitive.Mode.TRIANGLES)
        return null;
    const posArray = primitive.getAttribute("POSITION")?.getArray();
    if (!posArray)
        return null;
    const normArray = primitive.getAttribute("NORMAL")?.getArray() ?? null;
    const uvArray = primitive.getAttribute("TEXCOORD_0")?.getArray() ?? null;
    const indexArray = primitive.getIndices()?.getArray() ?? null;
    const vertexCount = posArray.length / 3;
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
        const location = new Vector3(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        const normal = normArray
            ? new Vector3(normArray[i * 3], normArray[i * 3 + 1], normArray[i * 3 + 2])
            : undefined;
        const uv = uvArray ? new Vector2(uvArray[i * 2], uvArray[i * 2 + 1]) : undefined;
        vertices.push(new Vertex({ location, normal, uv }));
    }
    const indices = indexArray
        ? Array.from(indexArray)
        : Array.from({ length: vertexCount }, (_, i) => i);
    return new Geometry(render3DPass, vertices, indices);
}
//# sourceMappingURL=gltf_loader.js.map