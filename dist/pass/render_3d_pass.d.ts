import type { InstanceMesh } from "../3d/mesh/instance";
import type { Mesh } from "../3d/mesh/mesh";
import { ShaderGadgetInstanceMeshModule } from "../shader/core/shader_instance_mesh_module";
import { ShaderGadgetMeshModule } from "../shader/core/shader_mesh_module";
import { Light, ShaderLightGadget } from "../shader/gadget/shader_light";
import type { Camera } from "../types/camera";
import type { WebGPUBuffer } from "../types/resource";
import { RenderPass, type RenderPassArg } from "./render_pass";
interface Render3DPassArg extends RenderPassArg {
    target: GPUTexture | HTMLCanvasElement;
    meshs?: Mesh[];
    instanceMesh?: InstanceMesh[];
    camera: Camera;
    loadOp?: GPULoadOp;
    format?: GPUTextureFormat;
    blend?: boolean;
    lights?: Light[];
    debugMode?: boolean;
}
export declare class Render3DPass extends RenderPass {
    meshs: Mesh[];
    instanceMesh: InstanceMesh[];
    camera: Camera;
    cameraBuffer: WebGPUBuffer;
    vpBuffer: WebGPUBuffer;
    lights: Light[];
    shaderLights: Record<number, ShaderLightGadget<any>>;
    lightBindGroupEntry: GPUBindGroupEntry[];
    shaderMeshRenderGadgetModule: ShaderGadgetMeshModule;
    shaderInstanceRenderGadgetModule: ShaderGadgetInstanceMeshModule;
    meshRenderShaderModule: GPUShaderModule;
    instnaceMeshRenderShaderModule: GPUShaderModule;
    instnaceMeshRenderShaderPipeline: GPURenderPipeline;
    private depthTexture;
    private depthWidth;
    private depthHeight;
    private cameraPosData;
    private vpData;
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
    update(): void;
    private getLightCountSnapshot;
    addLight(light: Light): void;
    removeLight(light: Light): void;
    encoderWriteCommand(encoder: GPUCommandEncoder, renderPassDescriptor: GPURenderPassDescriptor): void;
    updateBindGroupEntray(): void;
}
export {};
//# sourceMappingURL=render_3d_pass.d.ts.map