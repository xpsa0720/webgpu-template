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
    /** 모든 ShaderLightGadget에 등록된 light를 모아서 반환 */
    get lights(): Light[];
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
    private defaultSampler;
    private dummyTextureView;
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
    private getLightCountSnapshot;
    addLight(light: Light): void;
    removeLight(light: Light): void;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    private nodeRecursionRender;
    updateBindGroupEntray(): void;
}
export {};
//# sourceMappingURL=render_3d_pass.d.ts.map