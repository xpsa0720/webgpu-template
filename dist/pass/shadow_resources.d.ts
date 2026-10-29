import type { LightShadow } from "../../3d/shadow/lightShadow";
import type { ShaderLightGadget } from "../../shader/gadget/shader_light";
export type ShadowLightType = "directional" | "point";
export declare class ShadowResources {
    device: GPUDevice;
    sampler: GPUSampler;
    directionalTexture?: GPUTexture;
    directionalPvMatrixBuffer?: GPUBuffer;
    pointTexture?: GPUTexture;
    pointPvMatrixBuffer?: GPUBuffer;
    directionalCount: number;
    pointCount: number;
    constructor(device: GPUDevice);
    /**
     * castShadow인 light를 종류별로 정해진 순서로 반환한다.
     * 이 순서가 곧 PV 버퍼 칸 번호(i * 64) = shadow map texture layer 번호 = 셰이더 인덱스.
     * update / writePvMatrices / ShadowPass가 모두 이 함수만 사용해야 순서가 어긋나지 않는다.
     */
    getShadowLights(shaderLights: Record<number, ShaderLightGadget<any>>, type?: ShadowLightType): LightShadow[];
    /**
     * castShadow light 수에 맞춰 텍스처 배열 / PV 버퍼를 (재)생성한다.
     * @returns 리소스를 다시 만들었으면 true — 기존 버퍼를 destroy했으므로 호출 측은
     *          bind group entry를 갱신하고 캐시된 bind group을 비워야 한다.
     */
    update(shaderLights: Record<number, ShaderLightGadget<any>>): boolean;
    /**
     * castShadow인 light들의 PV matrix를 storage buffer에 기록한다.
     */
    writePvMatrices(shaderLights: Record<number, ShaderLightGadget<any>>): void;
    private writeLightPvMatrices;
    /**
     * 바인드 그룹 엔트리 배열 반환.
     * 셰이더에 shadow 바인딩이 선언된 경우에만 호출되므로,
     * 실제 리소스가 존재하는 바인딩만 반환한다.
     */
    getBindGroupEntries(): GPUBindGroupEntry[];
}
//# sourceMappingURL=shadow_resources.d.ts.map