import type { Render3DPass } from "../../pass/render_3d_pass";
import { Vector3 } from "../math/vector";
import type { Geometry } from "../node/mesh/geometry/geometry";
import { Matrial } from "../node/mesh/matrial/matrial";
import { Mesh } from "../node/mesh/mesh";

/** 파일에 재질 정보가 없을 때 쓰는 기본 재질 (회색) */
export function createDefaultMatrial(): Matrial {
  return new Matrial({ color: new Vector3(0.8, 0.8, 0.8) });
}

/** 로더가 만드는 Mesh는 transform을 Node가 담당하므로 로컬 transform은 항등 */
export function createLoadedMesh(
  render3DPass: Render3DPass,
  geometry: Geometry,
  matrial: Matrial,
): Mesh {
  return new Mesh({
    render3DPass,
    location: new Vector3(0, 0, 0),
    geometry,
    matrial,
  });
}

/** URL로 취급할 문자열인지 (그 외 문자열은 파일 내용 텍스트로 취급) */
export function isURL(input: string): boolean {
  return (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("/")
  );
}
