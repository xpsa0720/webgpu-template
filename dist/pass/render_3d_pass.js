import { ShaderGadgetInstanceMeshModule } from "../shader/core/shader_instance_mesh_module";
import { ShaderGadgetMeshModule } from "../shader/core/shader_mesh_module";
import { ShaderGadgetModule } from "../shader/core/shader_module";
import { AMBIENT_LIGHT, DIRECTIONAL_LIGHT, POINT_LIGHT, SHADER_CAMERA_POSITION_UNIFORM, SHADER_MATRIAL_UNIFORM, SHADER_MATRIX_UNIFORM, } from "../shader/gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIAL_STORAGE, SHADER_INSTANCE_MATRIX_STORAGE, SHADER_INSTANCE_VERTEX, } from "../shader/gadget/code/shader_instance";
import { ShaderbindingGadget } from "../shader/gadget/shader_binding";
import { AmbientLight, DirectionalLight, Light, PointLight, ShaderAmbientLightGadget, ShaderDirectionalLightGadget, ShaderLightGadget, ShaderPointLightGadget, } from "../shader/gadget/shader_light";
import { isView } from "../util/math";
import { createMatrix, createViewProjectionMatrix } from "../util/matrix";
import { RenderPass } from "./render_pass";
export class Render3DPass extends RenderPass {
    meshs;
    instanceMesh;
    camera;
    cameraBuffer;
    vpBuffer;
    lights;
    shaderLights;
    lightBindGroupEntry;
    shaderMeshRenderGadgetModule;
    shaderInstanceRenderGadgetModule;
    meshRenderShaderModule;
    // meshRenderShaderPipeline!: GPURenderPipeline;
    instnaceMeshRenderShaderModule;
    instnaceMeshRenderShaderPipeline;
    bindGroupMatrix = null;
    depthTexture = null;
    depthWidth = 0;
    depthHeight = 0;
    constructor(arg) {
        super(arg);
        this.meshs = arg.meshs ?? [];
        this.instanceMesh = arg.instanceMesh ?? [];
        this.lights = arg.lights ?? [];
        this.shaderLights = this.initLight();
        this.updateBindGroupEntray();
        this.shaderMeshRenderGadgetModule = new ShaderGadgetMeshModule({
            device: this.device,
            viewShaderCode: arg.debugMode,
        });
        this.shaderInstanceRenderGadgetModule = new ShaderGadgetInstanceMeshModule({
            device: this.device,
            viewShaderCode: arg.debugMode,
        });
        this.createShaderModule();
        this.settingPipeline();
        this.camera = arg.camera;
        this.cameraBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        // VP 행렬 uniform 버퍼 (인스턴싱용, mat4x4<f32> = 64바이트)
        this.vpBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 16,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
    }
    initLight() {
        const result = {};
        const usedBindings = new Set();
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
    createShaderModule() {
        let structCode = "";
        let functionCode = "";
        let fragmentCode = "";
        const lightGadgets = Object.values(this.shaderLights).sort((a, b) => a.binding - b.binding);
        lightGadgets.forEach((light) => {
            structCode += light.getStructUniformCode() + "\n";
            functionCode += light.getFunctionCode() + "\n";
            fragmentCode += light.getCode() + "\n";
        });
        this.meshRenderShaderModule = this.device.createShaderModule({
            code: this.shaderMeshRenderGadgetModule.getSourceCode({
                lightStructsUniforms: structCode,
                lightCode: fragmentCode,
                funtionCode: functionCode,
            }),
        });
        this.instnaceMeshRenderShaderModule = this.device.createShaderModule({
            code: this.shaderInstanceRenderGadgetModule.getSourceCode({
                lightStructsUniforms: structCode,
                lightCode: fragmentCode,
                funtionCode: functionCode,
            }),
        });
    }
    settingPipeline() {
        const mesh_pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.shaderMeshRenderGadgetModule.getVsEntryPoint(),
                module: this.meshRenderShaderModule,
                buffers: this.shaderMeshRenderGadgetModule.getVertexLayout(),
            },
            fragment: {
                entryPoint: this.shaderMeshRenderGadgetModule.getFsEntryPoint(),
                module: this.meshRenderShaderModule,
                targets: [
                    {
                        format: this.format,
                        blend: this.blendState,
                    },
                ],
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less",
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back",
            },
        });
        this.meshRenderShaderPipeline = mesh_pipeline;
        const instance_pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.shaderInstanceRenderGadgetModule.getVsEntryPoint(),
                module: this.instnaceMeshRenderShaderModule,
                buffers: this.shaderInstanceRenderGadgetModule.getVertexLayout(),
            },
            fragment: {
                entryPoint: this.shaderInstanceRenderGadgetModule.getFsEntryPoint(),
                module: this.instnaceMeshRenderShaderModule,
                targets: [
                    {
                        format: this.format,
                        blend: this.blendState,
                    },
                ],
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less",
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back",
            },
        });
        this.instnaceMeshRenderShaderPipeline = instance_pipeline;
        return mesh_pipeline;
    }
    getTargetSize() {
        if (this.target instanceof HTMLCanvasElement) {
            return [this.target.width, this.target.height];
        }
        return [this.target.width, this.target.height];
    }
    getAspect() {
        const [w, h] = this.getTargetSize();
        return w / h;
    }
    get pointLightGadget() {
        return this.shaderLights[0];
    }
    get ambientLightGadget() {
        return this.shaderLights[1];
    }
    get directionalLightGadget() {
        return this.shaderLights[2];
    }
    compile() {
        this.updateBindGroupEntray();
        this.createShaderModule();
        this.settingPipeline();
    }
    update() { }
    addLight(light) {
        if (light instanceof PointLight) {
            this.pointLightGadget.addLight(light);
        }
        else if (light instanceof AmbientLight) {
            this.ambientLightGadget.addLight(light);
        }
        else if (light instanceof DirectionalLight) {
            this.directionalLightGadget.addLight(light);
        }
        this.compile();
    }
    removeLight(light) {
        if (light instanceof PointLight) {
            const idx = this.pointLightGadget.lights.indexOf(light);
            if (idx !== -1)
                return this.pointLightGadget.removeLight(idx);
        }
        else if (light instanceof AmbientLight) {
            const idx = this.ambientLightGadget.lights.indexOf(light);
            if (idx !== -1)
                return this.ambientLightGadget.removeLight(idx);
        }
        else if (light instanceof DirectionalLight) {
            const idx = this.directionalLightGadget.lights.indexOf(light);
            if (idx !== -1)
                return this.directionalLightGadget.removeLight(idx);
        }
        this.compile();
    }
    encoderWriteCommand(encoder, renderPassDescriptor) {
        const aspect = this.getAspect();
        const [width, height] = this.getTargetSize();
        if (!this.depthTexture ||
            this.depthWidth !== width ||
            this.depthHeight !== height) {
            this.depthTexture?.destroy();
            this.depthTexture = this.device.createTexture({
                size: [width, height],
                format: "depth24plus",
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.depthWidth = width;
            this.depthHeight = height;
        }
        renderPassDescriptor.depthStencilAttachment = {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        };
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(this.meshRenderShaderPipeline);
        if (this.bindGroup) {
            pass.setBindGroup(0, this.bindGroup);
        }
        if (this.bindGroupTex) {
            pass.setBindGroup(1, this.bindGroupTex);
        }
        if (this.bindGroupSampler) {
            pass.setBindGroup(2, this.bindGroupSampler);
        }
        this.device.queue.writeBuffer(this.cameraBuffer.buffer, 0, new Float32Array([
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z,
            1,
        ]));
        this.meshs.forEach((mesh) => {
            // 나중에 구현해야됨
            // if (isView(mesh)) {
            // }
            createMatrix(mesh, this.camera, aspect, this.device, mesh.matrixBuffer);
            this.device.queue.writeBuffer(mesh.matrialBuffer.buffer, 0, new Float32Array(mesh.matrial.getDataArray()));
            this.bindGroupMatrix = this.device.createBindGroup({
                layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
                entries: [
                    { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                    { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
                    { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
                    // ...this.shaderMeshRenderGadgetModule.bindGroupEntry,
                    ...this.lightBindGroupEntry,
                ],
            });
            pass.setBindGroup(3, this.bindGroupMatrix);
            pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
            pass.drawIndexed(mesh.geometry.indexs.length);
        });
        if (this.instanceMesh.length > 0) {
            pass.setPipeline(this.instnaceMeshRenderShaderPipeline);
            // VP 행렬을 매 프레임 한 번만 계산해서 uniform에 기록
            const vpMatrix = createViewProjectionMatrix(this.camera, aspect);
            this.device.queue.writeBuffer(this.vpBuffer.buffer, 0, new Float32Array(vpMatrix.getArrayData()));
            this.instanceMesh.forEach((instanceMesh) => {
                instanceMesh.update();
                this.bindGroupMatrix = this.device.createBindGroup({
                    layout: this.instnaceMeshRenderShaderPipeline.getBindGroupLayout(3),
                    entries: [
                        { binding: 0, resource: { buffer: this.vpBuffer.buffer } },
                        { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
                        ...this.lightBindGroupEntry,
                        { binding: 20, resource: { buffer: instanceMesh.matrixBuffer.buffer } },
                        { binding: 21, resource: { buffer: instanceMesh.matrialBuffer.buffer } },
                    ],
                });
                pass.setBindGroup(3, this.bindGroupMatrix);
                pass.setVertexBuffer(0, instanceMesh.geometry.vertexBuffer.buffer);
                pass.setIndexBuffer(instanceMesh.geometry.indexBuffer.buffer, "uint16");
                pass.drawIndexed(instanceMesh.geometry.indexs.length, instanceMesh.count);
            });
        }
        pass.end();
    }
    updateBindGroupEntray() {
        const result = [];
        const lightGadgets = Object.values(this.shaderLights).sort((a, b) => a.binding - b.binding);
        lightGadgets.forEach((e) => {
            if (e.lights.length === 0)
                return;
            result.push({
                binding: e.binding,
                resource: { buffer: e.gpuBuffer.buffer },
            });
        });
        this.lightBindGroupEntry = result;
    }
}
//# sourceMappingURL=render_3d_pass.js.map