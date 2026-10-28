import type { LightShadow } from "../3d/shadow/lightShadow";
import type { ShaderLightGadget, ShadowGadget } from "../shader/gadget/shader_light";

const SHADOW_MAP_SIZE = 2048;

export type ShadowLightType = "directional" | "point";

export class ShadowResources {
  device: GPUDevice;

  sampler: GPUSampler;

  directionalTexture?: GPUTexture;
  directionalPvMatrixBuffer?: GPUBuffer;

  pointTexture?: GPUTexture;
  pointPvMatrixBuffer?: GPUBuffer;

  // 현재 할당된 castShadow light 수 (재생성 판단용)
  directionalCount: number = 0;
  pointCount: number = 0;

  constructor(device: GPUDevice) {
    this.device = device;
    this.sampler = device.createSampler({
      compare: "less-equal",
      magFilter: "linear",
      minFilter: "linear",
    });
  }

  /**
   * castShadow인 light를 종류별로 정해진 순서로 반환한다.
   * 이 순서가 곧 PV 버퍼 칸 번호(i * 64) = shadow map texture layer 번호 = 셰이더 인덱스.
   * update / writePvMatrices / ShadowPass가 모두 이 함수만 사용해야 순서가 어긋나지 않는다.
   */
  getShadowLights(
    shaderLights: Record<number, ShaderLightGadget<any>>,
    type?: ShadowLightType,
  ): LightShadow[] {
    const result: LightShadow[] = [];
    for (const gadget of Object.values(shaderLights)) {
      if (!isShadowGadget(gadget)) continue;
      if (type) {
        const isDir = gadget.shadowTextureDefine.includes("directional");
        if ((type === "directional") !== isDir) continue;
      }
      for (const light of gadget.lights) {
        if (isLightShadow(light) && light.castShadow) result.push(light);
      }
    }
    return result;
  }

  /**
   * castShadow light 수에 맞춰 텍스처 배열 / PV 버퍼를 (재)생성한다.
   * @returns 리소스를 다시 만들었으면 true — 기존 버퍼를 destroy했으므로 호출 측은
   *          bind group entry를 갱신하고 캐시된 bind group을 비워야 한다.
   */
  update(shaderLights: Record<number, ShaderLightGadget<any>>): boolean {
    const dirCount = this.getShadowLights(shaderLights, "directional").length;
    const ptCount = this.getShadowLights(shaderLights, "point").length;
    let recreated = false;

    // directional shadow 리소스
    if (dirCount !== this.directionalCount) {
      recreated = true;
      this.directionalTexture?.destroy();
      this.directionalPvMatrixBuffer?.destroy();
      this.directionalTexture = undefined;
      this.directionalPvMatrixBuffer = undefined;

      if (dirCount > 0) {
        this.directionalTexture = this.device.createTexture({
          size: [SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, dirCount],
          format: "depth32float",
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_SRC, // 디버그 
        });
        // mat4x4f = 64 bytes
        this.directionalPvMatrixBuffer = this.device.createBuffer({
          size: 64 * dirCount,
          usage:
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC,
        });
      }
      this.directionalCount = dirCount;
    }

    // point shadow 리소스
    if (ptCount !== this.pointCount) {
      recreated = true;
      this.pointTexture?.destroy();
      this.pointPvMatrixBuffer?.destroy();
      this.pointTexture = undefined;
      this.pointPvMatrixBuffer = undefined;

      if (ptCount > 0) {
        this.pointTexture = this.device.createTexture({
          size: [SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, ptCount],
          format: "depth32float",
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_SRC, // 디버그 readback(readShadowMap / readShadowMapColumns)용
        });
        this.pointPvMatrixBuffer = this.device.createBuffer({
          size: 64 * ptCount,
          usage:
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
        });
      }
      this.pointCount = ptCount;
    }
    return recreated;
  }

  /**
   * castShadow인 light들의 PV matrix를 storage buffer에 기록한다.
   */
  writePvMatrices(shaderLights: Record<number, ShaderLightGadget<any>>): void {
    this.writeLightPvMatrices(
      this.getShadowLights(shaderLights, "directional"),
      this.directionalPvMatrixBuffer,
    );
    this.writeLightPvMatrices(
      this.getShadowLights(shaderLights, "point"),
      this.pointPvMatrixBuffer,
    );
  }

  private writeLightPvMatrices(lights: LightShadow[], buffer?: GPUBuffer) {
    if (!buffer) return;
    lights.forEach((light, i) => {
      if (light.dirty) light.updateMatrix();
      this.device.queue.writeBuffer(buffer, i * 64, light.pvMatrix.getArrayData());
    });
  }

  /**
   * 바인드 그룹 엔트리 배열 반환.
   * 셰이더에 shadow 바인딩이 선언된 경우에만 호출되므로,
   * 실제 리소스가 존재하는 바인딩만 반환한다.
   */
  getBindGroupEntries(): GPUBindGroupEntry[] {
    const entries: GPUBindGroupEntry[] = [];

    // shadow 리소스가 하나도 없으면 빈 배열 (셰이더에도 바인딩 선언 없음)
    if (this.directionalCount === 0 && this.pointCount === 0) {
      return entries;
    }

    // binding 20: shadowSampler
    entries.push({
      binding: 20,
      resource: this.sampler,
    });

    // binding 21, 22: directional shadow
    if (this.directionalTexture && this.directionalPvMatrixBuffer) {
      entries.push({
        binding: 21,
        resource: this.directionalTexture.createView({ dimension: "2d-array" }),
      });
      entries.push({
        binding: 22,
        resource: { buffer: this.directionalPvMatrixBuffer },
      });
    }

    // binding 23, 24: point shadow
    if (this.pointTexture && this.pointPvMatrixBuffer) {
      entries.push({
        binding: 23,
        resource: this.pointTexture.createView({ dimension: "2d-array" }),
      });
      entries.push({
        binding: 24,
        resource: { buffer: this.pointPvMatrixBuffer },
      });
    }

    return entries;
  }
}

function isShadowGadget(
  gadget: ShaderLightGadget<any>,
): gadget is ShaderLightGadget<any> & ShadowGadget {
  return "getShadowDefinesCode" in gadget;
}

function isLightShadow(light: unknown): light is LightShadow {
  return (
    typeof (light as any).castShadow === "boolean" &&
    typeof (light as any).updateMatrix === "function"
  );
}
