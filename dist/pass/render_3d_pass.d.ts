import type { InstanceMesh } from "../3d/node/mesh/instance";
import type { Mesh } from "../3d/node/mesh/mesh";
import type { Node } from "../3d/node/node";
import { ShaderGadgetInstanceMeshModule } from "../shader/core/shader_instance_mesh_module";
import { ShaderGadgetMeshModule } from "../shader/core/shader_mesh_module";
import type { Light } from "../3d/light/light";
import { ShaderLightGadget } from "../shader/gadget/shader_light";
import type { Camera } from "../types/camera";
import { RenderPass, type RenderPassArg } from "./render_pass";
import { ShadowPass } from "./shadow_pass";
import { ShadowResources } from "./shadow_resources";
interface Render3DPassArg extends RenderPassArg {
    target: GPUTexture | HTMLCanvasElement;
    meshs?: Mesh[];
    nodes?: Node[];
    instanceMesh?: InstanceMesh[];
    camera: Camera;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
    blend?: boolean;
    debugMode?: boolean;
    debugViewShaderCode?: boolean;
}
export declare class Render3DPass extends RenderPass {
    meshs: Mesh[];
    nodes: Node[];
    instanceMesh: InstanceMesh[];
    camera: Camera;
    shaderLights: Record<number, ShaderLightGadget<any>>;
    lightBindGroupEntry: GPUBindGroupEntry[];
    shaderMeshRenderGadgetModule: ShaderGadgetMeshModule;
    shaderInstanceRenderGadgetModule: ShaderGadgetInstanceMeshModule;
    meshRenderShaderModule: GPUShaderModule;
    instnaceMeshRenderShaderModule: GPUShaderModule;
    instnaceMeshRenderShaderPipeline: GPURenderPipeline;
    shadowPass: ShadowPass;
    shadowResources: ShadowResources;
    private depthTexture;
    private depthWidth;
    private depthHeight;
    private msaaTexture;
    private defaultSampler;
    private dummyTextureView;
    private lightCountsBuffer;
    private shadowPresence;
    private lightCountsData;
    constructor(arg: Render3DPassArg);
    private initLight;
    createShaderModule(): void;
    settingPipeline(): GPURenderPipeline;
    private getTargetSize;
    private getAspect;
    private get pointLightGadget();
    private get ambientLightGadget();
    private get directionalLightGadget();
    compile(): void;
    private invalidateAllBindGroups;
    private invalidateNodeBindGroups;
    /** 종류별로 castShadow 조명이 있는지 (바뀌면 셰이더의 그림자 코드 유무가 달라지므로 재컴파일) */
    private getShadowPresence;
    private getLightCountSnapshot;
    addLight(light: Light): void;
    removeLight(light: Light): void;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    /** 실제 조명 개수가 바뀌었을 때만 lightCounts uniform에 쓴다 (셰이더 루프 횟수) */
    private writeLightCounts;
    private updateMesh;
    private updateNode;
    private updateInstanceMesh;
    private writeMatrial;
    private nodeRecursionRender;
    updateBindGroupEntray(): void;
}
export {};
//# sourceMappingURL=render_3d_pass.d.ts.map