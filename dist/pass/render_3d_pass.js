import { ShaderGadgetInstanceMeshModule } from "../shader/core/shader_instance_mesh_module";
import { ShaderGadgetMeshModule } from "../shader/core/shader_mesh_module";
import { SHADER_SHADOW_SAMPLER } from "../shader/gadget/code/shader_code";
import { isView } from "../util/math";
import { createMatrix, createModelMatrix } from "../util/matrix";
import { RenderPass } from "./render_pass";
import { ShadowPass } from "./shadow_pass";
import { LightResources } from "./resources/light_resources";
import { DummyResources } from "./resources/dummy_resources";
import { PostProcessingPass } from "./postprocessing_pass";
const MSAA_SAMPLE_COUNT = 4;
export class Render3DPass extends RenderPass {
    meshs;
    nodes;
    instanceMesh;
    camera;
    lightResources;
    shaderMeshRenderGadgetModule;
    instanceMeshRenderShaderModule;
    shaderInstanceRenderGadgetModule;
    meshRenderShaderModule;
    instanceMeshRenderShaderPipeline;
    shadowPass;
    depthTexture = null;
    depthWidth = 0;
    depthHeight = 0;
    msaaTexture = null;
    dummyResources;
    constructor(arg) {
        super(arg);
        this.meshs = arg.meshs ?? [];
        this.nodes = arg.nodes ?? [];
        this.instanceMesh = arg.instanceMesh ?? [];
        this.lightResources = new LightResources(this.device);
        this.shaderMeshRenderGadgetModule = new ShaderGadgetMeshModule({
            device: this.device,
            viewShaderCode: arg.debugViewShaderCode ?? arg.debugMode,
        });
        this.shaderInstanceRenderGadgetModule = new ShaderGadgetInstanceMeshModule({
            device: this.device,
            viewShaderCode: arg.debugViewShaderCode ?? arg.debugMode,
        });
        this.createShaderModule();
        this.settingPipeline();
        this.lightResources.currentShadowPresence =
            this.lightResources.getShadowPresence();
        this.camera = arg.camera;
        this.camera.cameraBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.camera.vpBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 16,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.shadowPass = new ShadowPass({
            device: this.device,
            render3DPass: this,
        });
        this.dummyResources = new DummyResources(this.device);
    }
    createShaderModule() {
        let structCode = "";
        let functionCode = "";
        let fragmentCode = "";
        let instanceFunctionCode = "";
        let instanceFragmentCode = "";
        let shadowDefinesCode = "";
        const lightGadgets = Object.values(this.lightResources.shaderLights).sort((a, b) => a.binding - b.binding);
        // 일반 Mesh용 코드 생성
        lightGadgets.forEach((light) => {
            structCode += light.getStructUniformCode() + "\n";
            functionCode += light.getFunctionCode() + "\n";
            fragmentCode += light.getCode() + "\n";
            if (isShadowGadget(light)) {
                shadowDefinesCode += light.getShadowDefinesCode();
            }
        });
        // Instance용 코드 생성 (shadow compare 코드가 다름)
        lightGadgets.forEach((light) => {
            if (isShadowGadget(light)) {
                instanceFunctionCode += light.getFunctionCode(true) + "\n";
                instanceFragmentCode += light.getCode(true) + "\n";
            }
            else {
                instanceFunctionCode += light.getFunctionCode() + "\n";
                instanceFragmentCode += light.getCode() + "\n";
            }
        });
        if (shadowDefinesCode.length > 0) {
            shadowDefinesCode = SHADER_SHADOW_SAMPLER + "\n" + shadowDefinesCode;
        }
        this.meshRenderShaderModule = this.device.createShaderModule({
            code: this.shaderMeshRenderGadgetModule.getSourceCode({
                lightStructsUniforms: structCode,
                lightCode: fragmentCode,
                functionCode: functionCode,
                shadowDefinesCode: shadowDefinesCode,
            }),
        });
        this.instanceMeshRenderShaderModule = this.device.createShaderModule({
            code: this.shaderInstanceRenderGadgetModule.getSourceCode({
                lightStructsUniforms: structCode,
                lightCode: instanceFragmentCode,
                functionCode: instanceFunctionCode,
                shadowDefinesCode: shadowDefinesCode,
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
                format: "depth32float",
                depthWriteEnabled: true,
                depthCompare: "less",
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back",
            },
            multisample: { count: MSAA_SAMPLE_COUNT },
        });
        this.meshRenderShaderPipeline = mesh_pipeline;
        const instance_pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.shaderInstanceRenderGadgetModule.getVsEntryPoint(),
                module: this.instanceMeshRenderShaderModule,
                buffers: this.shaderInstanceRenderGadgetModule.getVertexLayout(),
            },
            fragment: {
                entryPoint: this.shaderInstanceRenderGadgetModule.getFsEntryPoint(),
                module: this.instanceMeshRenderShaderModule,
                targets: [
                    {
                        format: this.format,
                        blend: this.blendState,
                    },
                ],
            },
            depthStencil: {
                format: "depth32float",
                depthWriteEnabled: true,
                depthCompare: "less",
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back",
            },
            multisample: { count: MSAA_SAMPLE_COUNT },
        });
        this.instanceMeshRenderShaderPipeline = instance_pipeline;
        return mesh_pipeline;
    }
    getTargetSize() {
        return [this.target.width, this.target.height];
    }
    getAspect() {
        const [w, h] = this.getTargetSize();
        return w / h;
    }
    compile() {
        this.lightResources.currentShadowPresence =
            this.lightResources.getShadowPresence();
        this.lightResources.shadowResources.update(this.lightResources.shaderLights);
        this.lightResources.updateBindGroupEntry();
        this.invalidateAllBindGroups();
        this.createShaderModule();
        this.settingPipeline();
    }
    invalidateAllBindGroups() {
        this.meshs.forEach((mesh) => {
            mesh.cachedBindGroup = null;
        });
        this.instanceMesh.forEach((im) => {
            im.cachedBindGroup = null;
        });
        this.invalidateNodeBindGroups(this.nodes);
    }
    invalidateNodeBindGroups(nodes) {
        nodes.forEach((node) => {
            node.meshs.forEach((mesh) => {
                mesh.cachedBindGroup = null;
            });
            this.invalidateNodeBindGroups(node.children);
        });
    }
    addLight(light) {
        const needsCompile = this.lightResources.addLight(light);
        if (needsCompile) {
            this.compile();
        }
        else {
            this.invalidateAllBindGroups();
        }
    }
    removeLight(light) {
        const needsCompile = this.lightResources.removeLight(light);
        if (needsCompile) {
            this.compile();
        }
        else {
            this.invalidateAllBindGroups();
        }
    }
    encoderWriteCommand(encoder, renderPassDescriptor) {
        const aspect = this.getAspect();
        const [width, height] = this.getTargetSize();
        if (!this.depthTexture ||
            this.depthWidth !== width ||
            this.depthHeight !== height) {
            this.depthTexture?.destroy();
            this.msaaTexture?.destroy();
            this.msaaTexture = null;
            this.depthTexture = this.device.createTexture({
                size: [width, height],
                format: "depth32float",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                sampleCount: MSAA_SAMPLE_COUNT,
            });
            if (MSAA_SAMPLE_COUNT > 1) {
                this.msaaTexture = this.device.createTexture({
                    size: [width, height],
                    format: this.format,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT,
                    sampleCount: MSAA_SAMPLE_COUNT,
                });
            }
            this.depthWidth = width;
            this.depthHeight = height;
        }
        renderPassDescriptor.depthStencilAttachment = {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        };
        if (this.msaaTexture) {
            const colorAtt = renderPassDescriptor.colorAttachments;
            colorAtt[0].resolveTarget = colorAtt[0].view;
            colorAtt[0].view = this.msaaTexture.createView();
        }
        this.camera.update(this.device, aspect);
        const vpMatrix = this.camera.vpMatrix;
        const presence = this.lightResources.getShadowPresence();
        if (presence.some((v, i) => v !== this.lightResources.currentShadowPresence[i])) {
            this.compile();
        }
        else if (this.lightResources.shadowResources.update(this.lightResources.shaderLights)) {
            this.lightResources.updateBindGroupEntry();
            this.invalidateAllBindGroups();
        }
        this.lightResources.shadowResources.writePvMatrices(this.lightResources.shaderLights);
        this.lightResources.writeLightCounts();
        this.updateMesh();
        // shadow pass는 메인 렌더 패스 시작 전에 실행 (encoder에 pass 중첩 불가)
        this.shadowPass.createPass(encoder);
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
        this.renderMeshs(pass, vpMatrix);
        this.nodeRecursionRender(this.nodes, vpMatrix, pass);
        this.renderInstanceMeshs(pass, vpMatrix);
        pass.end();
    }
    updateMesh() {
        // getDataArray()가 Matrial.dirty를 false로 바꾸는 문제 해결
        const updatedMatrials = new Set();
        this.meshs.forEach((mesh) => {
            if (mesh.dirty) {
                createMatrix(mesh, this.device, mesh.matrixBuffer);
                mesh.dirty = false;
            }
            this.writeMatrial(mesh, updatedMatrials);
        });
        this.updateNode(this.nodes, updatedMatrials);
        this.updateInstanceMesh();
    }
    updateNode(nodes, updatedMatrials) {
        nodes.forEach((node) => {
            if (node.dirty)
                node.updateWorld();
            node.meshs.forEach((mesh) => {
                if (mesh.dirty) {
                    createMatrix(mesh, this.device, mesh.matrixBuffer, {
                        parentWorldMat: node.worldMat,
                        parentNormalMat: node.normalMat,
                    });
                    mesh.dirty = false;
                }
                this.writeMatrial(mesh, updatedMatrials);
            });
            if (node.children.length > 0)
                this.updateNode(node.children, updatedMatrials);
        });
    }
    updateInstanceMesh() {
        this.instanceMesh.forEach((instanceMesh) => {
            instanceMesh.update();
        });
    }
    writeMatrial(mesh, updatedMatrials) {
        const matrial = mesh.matrial;
        if (!matrial.dirty && !updatedMatrials.has(matrial))
            return;
        updatedMatrials.add(matrial);
        this.device.queue.writeBuffer(mesh.matrialBuffer.buffer, 0, matrial.getDataArray());
    }
    renderMeshs(pass, vpMatrix) {
        this.meshs.forEach((mesh) => {
            const M = createModelMatrix(mesh);
            if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M))
                return;
            if (!mesh.cachedBindGroup) {
                mesh.cachedBindGroup = this.device.createBindGroup({
                    layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
                    entries: [
                        { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                        {
                            binding: 1,
                            resource: { buffer: this.camera.cameraBuffer.buffer },
                        },
                        { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
                        { binding: 3, resource: { buffer: this.camera.vpBuffer.buffer } },
                        {
                            binding: 4,
                            resource: mesh.matrial.texture?.texture.createView() ??
                                this.dummyResources.textureView,
                        },
                        { binding: 5, resource: this.dummyResources.sampler },
                        ...this.lightResources.lightBindGroupEntry,
                    ],
                });
            }
            pass.setBindGroup(3, mesh.cachedBindGroup);
            pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
            pass.drawIndexed(mesh.geometry.indexs.length);
        });
    }
    renderInstanceMeshs(pass, vpMatrix) {
        if (this.instanceMesh.length === 0)
            return;
        pass.setPipeline(this.instanceMeshRenderShaderPipeline);
        this.instanceMesh.forEach((instanceMesh) => {
            instanceMesh.frustumCull(vpMatrix, this.lightResources.getShadowLightPvMatrices());
            if (instanceMesh.renderCount === 0)
                return;
            if (!instanceMesh.cachedBindGroup) {
                instanceMesh.cachedBindGroup = this.device.createBindGroup({
                    layout: this.instanceMeshRenderShaderPipeline.getBindGroupLayout(3),
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer: this.camera.vpBuffer.buffer },
                        },
                        {
                            binding: 1,
                            resource: { buffer: this.camera.cameraBuffer.buffer },
                        },
                        {
                            binding: 4,
                            resource: this.dummyResources.textureView,
                        },
                        { binding: 5, resource: this.dummyResources.sampler },
                        ...this.lightResources.lightBindGroupEntry,
                        {
                            binding: 30,
                            resource: { buffer: instanceMesh.matrixBuffer.buffer },
                        },
                        {
                            binding: 31,
                            resource: { buffer: instanceMesh.matrialBuffer.buffer },
                        },
                    ],
                });
            }
            pass.setBindGroup(3, instanceMesh.cachedBindGroup);
            pass.setVertexBuffer(0, instanceMesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(instanceMesh.geometry.indexBuffer.buffer, "uint32");
            pass.drawIndexed(instanceMesh.geometry.indexs.length, instanceMesh.renderCount);
        });
    }
    nodeRecursionRender(nodes, vpMatrix, pass) {
        nodes.forEach((node) => {
            node.meshs.forEach((mesh) => {
                const M = createModelMatrix(mesh).multiply(node.worldMat);
                if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M))
                    return;
                if (!mesh.cachedBindGroup) {
                    mesh.cachedBindGroup = this.device.createBindGroup({
                        layout: this.meshRenderShaderPipeline.getBindGroupLayout(3),
                        entries: [
                            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                            {
                                binding: 1,
                                resource: { buffer: this.camera.cameraBuffer.buffer },
                            },
                            { binding: 2, resource: { buffer: mesh.matrialBuffer.buffer } },
                            {
                                binding: 3,
                                resource: { buffer: this.camera.vpBuffer.buffer },
                            },
                            {
                                binding: 4,
                                resource: mesh.matrial.texture?.texture.createView() ??
                                    this.dummyResources.textureView,
                            },
                            { binding: 5, resource: this.dummyResources.sampler },
                            ...this.lightResources.lightBindGroupEntry,
                        ],
                    });
                }
                pass.setBindGroup(3, mesh.cachedBindGroup);
                pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
                pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
                pass.drawIndexed(mesh.geometry.indexs.length);
            });
            if (node.children.length > 0)
                this.nodeRecursionRender(node.children, vpMatrix, pass);
        });
    }
}
function isShadowGadget(gadget) {
    return "getShadowDefinesCode" in gadget;
}
//# sourceMappingURL=render_3d_pass.js.map