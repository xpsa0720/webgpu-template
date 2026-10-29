import type { Mat4x4 } from "../../3d/math/matrix";
import { AmbientLight } from "../../3d/light/ambient_light";
import { DirectionalLight } from "../../3d/light/directional_light";
import type { Light } from "../../3d/light/light";
import { PointLight } from "../../3d/light/point_light";
import {
  AMBIENT_LIGHT,
  DIRECTIONAL_LIGHT,
  POINT_LIGHT,
} from "../../shader/gadget/code/shader_code";
import {
  formatLightCount,
  ShaderAmbientLightGadget,
  ShaderDirectionalLightGadget,
  ShaderLightGadget,
  ShaderPointLightGadget,
  type ShadowGadget,
} from "../../shader/gadget/shader_light";
import { roundUp } from "../../util/vertex_layout";
import { ShadowResources } from "./shadow_resources";

export class LightResources {
  shaderLights: Record<number, ShaderLightGadget<any>>;
  lightBindGroupEntry!: GPUBindGroupEntry[];
  shadowResources: ShadowResources;

  private device: GPUDevice;
  private lightCountsBuffer: GPUBuffer;
  private lightCountsData = new Uint32Array(4);
  private shadowPresence: boolean[] = [];

  constructor(device: GPUDevice) {
    this.device = device;
    this.lightCountsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    this.lightCountsData.fill(0xffffffff); // 첫 프레임에 반드시 쓰도록 무효값으로 시작
    this.shaderLights = this.initLight();
    this.updateBindGroupEntry();
    this.shadowResources = new ShadowResources(device);
    this.shadowResources.update(this.shaderLights);
  }

  private initLight() {
    const result: Record<number, ShaderLightGadget<any>> = {};
    const usedBindings = new Set<number>();

    const LIGHT_CODE_LIST = [
      new ShaderPointLightGadget({
        struct: POINT_LIGHT.struct,
        define: POINT_LIGHT.define,
        countPlaceholder: POINT_LIGHT.countPlaceholder,
        group: 3,
        binding: 10,
        code: POINT_LIGHT.code,
        func: POINT_LIGHT.func,
        device: this.device,
        shadowAddCode: POINT_LIGHT.shadowAddCode,
        shadowAddFunc: POINT_LIGHT.shadowAddFunc,
        instanceShadowAddCode: POINT_LIGHT.instanceShadowAddCode,
        instanceShadowAddFunc: POINT_LIGHT.instanceShadowAddFunc,
      }),
      new ShaderAmbientLightGadget({
        struct: AMBIENT_LIGHT.struct,
        define: AMBIENT_LIGHT.define,
        countPlaceholder: AMBIENT_LIGHT.countPlaceholder,
        group: 3,
        binding: 11,
        code: AMBIENT_LIGHT.code,
        func: AMBIENT_LIGHT.func,
        device: this.device,
      }),
      new ShaderDirectionalLightGadget({
        struct: DIRECTIONAL_LIGHT.struct,
        define: DIRECTIONAL_LIGHT.define,
        countPlaceholder: DIRECTIONAL_LIGHT.countPlaceholder,
        group: 3,
        binding: 12,
        code: DIRECTIONAL_LIGHT.code,
        func: DIRECTIONAL_LIGHT.func,
        device: this.device,
        shadowAddCode: DIRECTIONAL_LIGHT.shadowAddCode,
        shadowAddFunc: DIRECTIONAL_LIGHT.shadowAddFunc,
        instanceShadowAddCode: DIRECTIONAL_LIGHT.instanceShadowAddCode,
        instanceShadowAddFunc: DIRECTIONAL_LIGHT.instanceShadowAddFunc,
      }),
    ];
    LIGHT_CODE_LIST.forEach((e, i) => {
      if (usedBindings.has(e.binding)) {
        throw new Error(`Light binding 번호 ${e.binding}이 중복됨`);
      }
      usedBindings.add(e.binding);
      result[i] = e;
    });
    return result;
  }

  private get pointLightGadget() {
    return this.shaderLights[0];
  }

  private get ambientLightGadget() {
    return this.shaderLights[1];
  }

  private get directionalLightGadget() {
    return this.shaderLights[2];
  }

  /** 종류별로 castShadow 조명이 있는지 (바뀌면 셰이더의 그림자 코드 유무가 달라지므로 재컴파일) */
  getShadowPresence(): boolean[] {
    return Object.values(this.shaderLights).map(
      (g) => isShadowGadget(g) && g.hasShadow,
    );
  }

  /** 마지막으로 컴파일된 시점의 shadowPresence를 저장/반환 */
  get currentShadowPresence(): boolean[] {
    return this.shadowPresence;
  }

  set currentShadowPresence(value: boolean[]) {
    this.shadowPresence = value;
  }

  private getLightCountSnapshot() {
    return Object.values(this.shaderLights).map((g) =>
      roundUp(formatLightCount, g.lights.length),
    );
  }

  /**
   * @returns 재컴파일이 필요하면 true
   */
  addLight(light: Light): boolean {
    const before = this.getLightCountSnapshot();

    if (light instanceof PointLight) {
      this.pointLightGadget.addLight(light);
    } else if (light instanceof AmbientLight) {
      this.ambientLightGadget.addLight(light);
    } else if (light instanceof DirectionalLight) {
      this.directionalLightGadget.addLight(light);
    }

    const after = this.getLightCountSnapshot();
    if (before.some((v, i) => v !== after[i])) {
      return true; // 재컴파일 필요
    }
    this.updateBindGroupEntry();
    return false;
  }

  /**
   * @returns 재컴파일이 필요하면 true
   */
  removeLight(light: Light): boolean {
    const before = this.getLightCountSnapshot();

    if (light instanceof PointLight) {
      const idx = this.pointLightGadget.lights.indexOf(light);
      if (idx !== -1) this.pointLightGadget.removeLight(idx);
    } else if (light instanceof AmbientLight) {
      const idx = this.ambientLightGadget.lights.indexOf(light);
      if (idx !== -1) this.ambientLightGadget.removeLight(idx);
    } else if (light instanceof DirectionalLight) {
      const idx = this.directionalLightGadget.lights.indexOf(light);
      if (idx !== -1) this.directionalLightGadget.removeLight(idx);
    }

    const after = this.getLightCountSnapshot();
    if (before.some((v, i) => v !== after[i])) {
      return true; // 재컴파일 필요
    }
    this.updateBindGroupEntry();
    return false;
  }

  /** 실제 조명 개수가 바뀌었을 때만 lightCounts uniform에 쓴다 (셰이더 루프 횟수) */
  writeLightCounts() {
    const point = this.pointLightGadget.lights.length;
    const ambient = this.ambientLightGadget.lights.length;
    const directional = this.directionalLightGadget.lights.length;
    const d = this.lightCountsData;
    if (d[0] === point && d[1] === ambient && d[2] === directional) return;
    d[0] = point;
    d[1] = ambient;
    d[2] = directional;
    d[3] = 0;
    this.device.queue.writeBuffer(this.lightCountsBuffer, 0, d);
  }

  updateBindGroupEntry() {
    const result: GPUBindGroupEntry[] = [];
    const lightGadgets = Object.values(this.shaderLights).sort(
      (a, b) => a.binding - b.binding,
    );
    lightGadgets.forEach((e) => {
      if (e.lights.length === 0) return;
      result.push({
        binding: e.binding,
        resource: { buffer: e.gpuBuffer.buffer },
      });
    });

    // 실제 조명 개수 전달
    if (lightGadgets.some((g) => g.lights.length > 0)) {
      result.push({
        binding: 13,
        resource: { buffer: this.lightCountsBuffer },
      });
    }
    // shadow 리소스 바인딩 (20~24) 추가
    if (this.shadowResources) {
      result.push(...this.shadowResources.getBindGroupEntries());
    }
    this.lightBindGroupEntry = result;
  }

  /** frustumCull용 라이트 PV 배열 */
  getShadowLightPvMatrices(): Mat4x4[] {
    return this.shadowResources
      .getShadowLights(this.shaderLights)
      .map((l) => l.pvMatrix);
  }
}

function isShadowGadget(
  gadget: ShaderLightGadget<any>,
): gadget is ShaderLightGadget<any> & ShadowGadget {
  return "getShadowDefinesCode" in gadget;
}
