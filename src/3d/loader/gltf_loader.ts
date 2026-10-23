import { WebIO, Logger } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { Vector2, Vector3 } from "../math/vector";
import { Vertex } from "../mesh/unit/vertex";
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
export async function loadGLTF(
  input: File | FileList | File[] | ArrayBuffer | string,
): Promise<LoadResult> {
  const io = new WebIO()
    .setLogger(new Logger(Logger.Verbosity.ERROR))
    .registerExtensions(ALL_EXTENSIONS);

  // URL → WebIO.read()로 직접 로드 (외부 리소스 자동 fetch)
  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("/")) {
      const doc = await io.read(input);
      return extractFromDocument(doc);
    }
    throw new Error("glTF 로더는 URL 또는 ArrayBuffer/File만 지원합니다.");
  }

  // ArrayBuffer → GLB로 처리
  if (input instanceof ArrayBuffer) {
    const doc = await io.readBinary(new Uint8Array(input));
    return extractFromDocument(doc);
  }

  // FileList / File[] → 여러 파일 처리
  const files: File[] = input instanceof File ? [input] : Array.from(input);

  // .gltf 또는 .glb 메인 파일 찾기
  const mainFile = files.find(
    (f) => f.name.toLowerCase().endsWith(".gltf") || f.name.toLowerCase().endsWith(".glb"),
  );
  if (!mainFile) {
    throw new Error("glTF/GLB 파일을 찾을 수 없습니다.");
  }

  const mainBuffer = await mainFile.arrayBuffer();

  // .glb → 단독으로 readBinary
  if (mainFile.name.toLowerCase().endsWith(".glb")) {
    const doc = await io.readBinary(new Uint8Array(mainBuffer));
    return extractFromDocument(doc);
  }

  // .gltf → JSON 파싱 + 동반 파일(.bin, 텍스처)을 resources로 매핑
  const text = new TextDecoder("utf-8").decode(mainBuffer);
  const json = JSON.parse(text);

  const resources: { [s: string]: Uint8Array<ArrayBuffer> } = {};
  for (const file of files) {
    if (file === mainFile) continue;
    const buf: ArrayBuffer = await file.arrayBuffer();
    resources[file.name] = new Uint8Array(buf);
  }

  const doc = await io.readJSON({ json, resources });
  return extractFromDocument(doc);
}

/**
 * gltf-transform Document에서 모든 mesh의 primitive를 순회하며
 * Vertex + index 배열을 추출한다.
 */
function extractFromDocument(
  doc: Awaited<ReturnType<WebIO["read"]>>,
): LoadResult {
  const allVertices: Vertex[] = [];
  const allIndices: number[] = [];

  const meshes = doc.getRoot().listMeshes();

  for (const mesh of meshes) {
    for (const primitive of mesh.listPrimitives()) {
      const posAccessor = primitive.getAttribute("POSITION");
      if (!posAccessor) continue;

      const posArray = posAccessor.getArray();
      if (!posArray) continue;

      const normAccessor = primitive.getAttribute("NORMAL");
      const normArray = normAccessor?.getArray() ?? null;

      const uvAccessor = primitive.getAttribute("TEXCOORD_0");
      const uvArray = uvAccessor?.getArray() ?? null;

      const indexAccessor = primitive.getIndices();
      const indexArray = indexAccessor?.getArray() ?? null;

      const vertexCount = posAccessor.getCount();
      const baseIndex = allVertices.length;

      for (let i = 0; i < vertexCount; i++) {
        const px = posArray[i * 3];
        const py = posArray[i * 3 + 1];
        const pz = posArray[i * 3 + 2];
        const location = new Vector3(px, py, pz);

        let normal: Vector3 | undefined;
        if (normArray) {
          normal = new Vector3(
            normArray[i * 3],
            normArray[i * 3 + 1],
            normArray[i * 3 + 2],
          );
        }

        let uv: Vector2 | undefined;
        if (uvArray) {
          uv = new Vector2(
            uvArray[i * 2],
            uvArray[i * 2 + 1],
          );
        }

        allVertices.push(new Vertex({ location, normal, uv }));
      }

      if (indexArray) {
        for (let i = 0; i < indexArray.length; i++) {
          allIndices.push(baseIndex + indexArray[i]);
        }
      } else {
        for (let i = 0; i < vertexCount; i++) {
          allIndices.push(baseIndex + i);
        }
      }
    }
  }

  return { vertices: allVertices, indices: allIndices };
}
