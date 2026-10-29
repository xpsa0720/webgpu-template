import type { Mat4x4 } from "../../3d/math/matrix";
import type { Light } from "../../3d/light/light";
import { ShaderLightGadget } from "../../shader/gadget/shader_light";
import { ShadowResources } from "./shadow_resources";
export declare class LightResources {
    shaderLights: Record<number, ShaderLightGadget<any>>;
    lightBindGroupEntry: GPUBindGroupEntry[];
    shadowResources: ShadowResources;
    private device;
    private lightCountsBuffer;
    private lightCountsData;
    private shadowPresence;
    constructor(device: GPUDevice);
    private initLight;
    private get pointLightGadget();
    private get ambientLightGadget();
    private get directionalLightGadget();
    /** 종류별로 castShadow 조명이 있는지 (바뀌면 셰이더의 그림자 코드 유무가 달라지므로 재컴파일) */
    getShadowPresence(): boolean[];
    /** 마지막으로 컴파일된 시점의 shadowPresence를 저장/반환 */
    get currentShadowPresence(): boolean[];
    set currentShadowPresence(value: boolean[]);
    private getLightCountSnapshot;
    /**
     * @returns 재컴파일이 필요하면 true
     */
    addLight(light: Light): boolean;
    /**
     * @returns 재컴파일이 필요하면 true
     */
    removeLight(light: Light): boolean;
    /** 실제 조명 개수가 바뀌었을 때만 lightCounts uniform에 쓴다 (셰이더 루프 횟수) */
    writeLightCounts(): void;
    updateBindGroupEntry(): void;
    /** frustumCull용 라이트 PV 배열 */
    getShadowLightPvMatrices(): Mat4x4[];
}
//# sourceMappingURL=light_resources.d.ts.map