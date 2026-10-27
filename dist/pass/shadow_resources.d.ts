import type { ShaderLightGadget } from "../shader/gadget/shader_light";
/**
 * Shadow 관련 GPU 리소스를 중앙 관리하는 클래스.
 * group(3) binding 20~24에 해당하는 리소스를 생성/갱신/바인딩한다.
 */
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
    update(shaderLights: Record<number, ShaderLightGadget<any>>): void;
    /**
     * castShadow인 light들의 PV matrix를 storage buffer에 기록한다.
     */
    writePvMatrices(shaderLights: Record<number, ShaderLightGadget<any>>): void;
    /**
     * 바인드 그룹 엔트리 배열 반환.
     * 셰이더에 shadow 바인딩이 선언된 경우에만 호출되므로,
     * 실제 리소스가 존재하는 바인딩만 반환한다.
     */
    getBindGroupEntries(): GPUBindGroupEntry[];
}
//# sourceMappingURL=shadow_resources.d.ts.map