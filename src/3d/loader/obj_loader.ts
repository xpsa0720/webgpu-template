import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector2, Vector3, Vector4 } from "../math/vector";
import { Geometry } from "../node/mesh/geometry/geometry";
import { Matrial } from "../node/mesh/matrial/matrial";
import { Specular } from "../node/mesh/matrial/specular";
import { Vertex } from "../node/mesh/unit/vertex";
import { Node } from "../node/node";
import { createDefaultMatrial, createLoadedMesh, isURL } from "./common";

/** usemtl 하나에 해당하는 면 묶음 (= Mesh 하나) */
interface OBJGroup {
  matrialName: string | null;
  vertices: Vertex[];
  indices: number[];
  // pos/uv/norm 조합 → 이 그룹에서 이미 생성된 vertex 인덱스
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
export function parseOBJ(text: string): ParsedOBJ {
  const positions: number[][] = [];
  const normals: number[][] = [];
  const uvs: number[][] = [];

  const mtllibs: string[] = [];
  const groups = new Map<string | null, OBJGroup>();
  let current = getGroup(groups, null);

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const keyword = parts[0];

    if (keyword === "v") {
      positions.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      ]);
    } else if (keyword === "vn") {
      normals.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      ]);
    } else if (keyword === "vt") {
      uvs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
    } else if (keyword === "mtllib") {
      mtllibs.push(line.slice("mtllib".length).trim());
    } else if (keyword === "usemtl") {
      current = getGroup(groups, line.slice("usemtl".length).trim());
    } else if (keyword === "f") {
      const faceIndices: number[] = [];
      for (let i = 1; i < parts.length; i++) {
        faceIndices.push(
          getOrCreateVertex(parts[i], positions, normals, uvs, current),
        );
      }
      // 삼각형 팬 방식으로 분할 (3각형, 4각형, n각형 모두 처리)
      for (let i = 1; i < faceIndices.length - 1; i++) {
        current.indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
      }
    }
  }

  return {
    mtllibs,
    groups: [...groups.values()].filter((g) => g.indices.length > 0),
  };
}

function getGroup(
  groups: Map<string | null, OBJGroup>,
  matrialName: string | null,
): OBJGroup {
  let group = groups.get(matrialName);
  if (!group) {
    group = { matrialName, vertices: [], indices: [], vertexMap: new Map() };
    groups.set(matrialName, group);
  }
  return group;
}

/**
 * face vertex 문자열(예: "1/2/3")을 파싱하여
 * 그룹 안에 중복이 없으면 새 Vertex를 생성, 있으면 기존 인덱스를 반환한다.
 */
function getOrCreateVertex(
  faceStr: string,
  positions: number[][],
  normals: number[][],
  uvs: number[][],
  group: OBJGroup,
): number {
  const existing = group.vertexMap.get(faceStr);
  if (existing !== undefined) return existing;

  const parts = faceStr.split("/");

  // OBJ 인덱스는 1-based
  const posIdx = parseInt(parts[0]) - 1;
  const uvIdx = parts.length > 1 && parts[1] !== "" ? parseInt(parts[1]) - 1 : -1;
  const normIdx = parts.length > 2 && parts[2] !== "" ? parseInt(parts[2]) - 1 : -1;

  const pos = positions[posIdx];
  const location = new Vector3(pos[0], pos[1], pos[2]);

  let normal: Vector3 | undefined;
  if (normIdx >= 0 && normals[normIdx]) {
    const n = normals[normIdx];
    normal = new Vector3(n[0], n[1], n[2]);
  }

  let uv: Vector2 | undefined;
  if (uvIdx >= 0 && uvs[uvIdx]) {
    const t = uvs[uvIdx];
    uv = new Vector2(t[0], t[1]);
  }

  const index = group.vertices.length;
  group.vertices.push(new Vertex({ location, normal, uv }));
  group.vertexMap.set(faceStr, index);

  return index;
}

/**
 * MTL 파일 텍스트를 파싱하여 재질 이름 → Matrial 맵을 반환한다.
 * 지원: Kd(기본색), d / Tr(투명도), Ks(specular 색), Ns(shininess)
 */
export function parseMTL(text: string): Map<string, Matrial> {
  const result = new Map<string, Matrial>();
  let name: string | null = null;
  let kd: number[] | null = null;
  let ks: number[] | null = null;
  let ns: number | undefined;
  let opacity = 1;

  const flush = () => {
    if (name === null) return;
    result.set(
      name,
      new Matrial({
        color: kd ? new Vector3(kd[0], kd[1], kd[2]) : new Vector3(0.8, 0.8, 0.8),
        opacity,
        specular: new Specular({
          shininess: ns,
          color: ks ? new Vector4(ks[0], ks[1], ks[2], 1) : undefined,
        }),
      }),
    );
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    const keyword = parts[0];

    if (keyword === "newmtl") {
      flush();
      name = line.slice("newmtl".length).trim();
      kd = null;
      ks = null;
      ns = undefined;
      opacity = 1;
    } else if (keyword === "Kd") {
      kd = parts.slice(1, 4).map(parseFloat);
    } else if (keyword === "Ks") {
      ks = parts.slice(1, 4).map(parseFloat);
    } else if (keyword === "Ns") {
      ns = parseFloat(parts[1]);
    } else if (keyword === "d") {
      opacity = parseFloat(parts[1]);
    } else if (keyword === "Tr") {
      opacity = 1 - parseFloat(parts[1]);
    }
  }
  flush();

  return result;
}

/**
 * mtllib 파일들을 찾아 읽는다.
 * - companions(드래그 앤 드롭된 파일들)에서 같은 이름의 파일을 먼저 찾고
 * - 없으면 OBJ를 URL로 불러온 경우 그 URL 기준 상대 경로로 fetch
 * 찾지 못한 파일은 경고만 출력하고 건너뛴다.
 */
async function loadMTLs(
  mtllibs: string[],
  baseURL: string | null,
  companions: File[],
): Promise<Map<string, Matrial>> {
  const result = new Map<string, Matrial>();

  for (const lib of mtllibs) {
    const fileName = lib.split(/[\\/]/).pop()!;
    let text: string | null = null;

    const file = companions.find((f) => f.name === fileName);
    if (file) {
      text = await file.text();
    } else if (baseURL) {
      const response = await fetch(new URL(lib, new URL(baseURL, location.href)));
      if (response.ok) text = await response.text();
    }

    if (text === null) {
      console.warn(`OBJ: mtllib "${lib}"을 찾을 수 없어 기본 재질을 사용합니다.`);
      continue;
    }
    parseMTL(text).forEach((m, name) => result.set(name, m));
  }

  return result;
}

/**
 * OBJ 파일을 로드하여 루트 Node를 반환한다.
 * usemtl 단위로 Mesh를 나눠 루트 Node의 meshs에 넣는다.
 *
 * 입력: File, ArrayBuffer(UTF-8), URL string, 또는 OBJ 텍스트 string
 * companions: .mtl 등 함께 전달된 파일 (드래그 앤 드롭 시)
 */
export async function loadOBJ(
  render3DPass: Render3DPass,
  input: File | ArrayBuffer | string,
  companions: File[] = [],
): Promise<Node> {
  let text: string;
  let baseURL: string | null = null;

  if (typeof input === "string") {
    if (isURL(input)) {
      const response = await fetch(input);
      text = await response.text();
      baseURL = input;
    } else {
      text = input;
    }
  } else if (input instanceof File) {
    text = await input.text();
  } else {
    text = new TextDecoder("utf-8").decode(input);
  }

  const parsed = parseOBJ(text);
  const matrials = await loadMTLs(parsed.mtllibs, baseURL, companions);
  const defaultMatrial = createDefaultMatrial();

  const meshs = parsed.groups.map((group) => {
    const matrial =
      (group.matrialName !== null && matrials.get(group.matrialName)) ||
      defaultMatrial;
    const geometry = new Geometry(render3DPass, group.vertices, group.indices);
    return createLoadedMesh(render3DPass, geometry, matrial);
  });

  return new Node({
    render3DPass,
    location: new Vector3(0, 0, 0),
    meshs,
  });
}
