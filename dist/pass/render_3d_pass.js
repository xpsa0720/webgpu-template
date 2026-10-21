import { ShaderGadgetModule } from "../shader/core/shader_module";
import { SHADER_MATRIAL_STRUCT, SHADER_MATRIX_STRUCT, } from "../shader/gadget/basic/structs";
import { AmbientLight, DirectionalLight, Light, PointLight, } from "../shader/gadget/shader_light";
import { wgslStructSize } from "../util/math";
import { createMatrix } from "../util/matrix";
import { Pass } from "./pass";
import { RenderPass } from "./render_pass";
export class Render3DPass extends RenderPass {
    meshs;
    camera;
    matrixBuffer;
    cameraBuffer;
    matrialBuffer;
    shaderGadgetModule;
    shaderModule;
    pipeline;
    bindGroupMatrix = null;
    depthTexture = null;
    depthWidth = 0;
    depthHeight = 0;
    lihgtUpdate = true;
    lightEntries = [];
    constructor(arg) {
        super(arg);
        this.meshs = arg.meshs ?? [];
        this.shaderGadgetModule = new ShaderGadgetModule(this.device, () => {
            this.lihgtUpdate = true;
            this.shaderModule = this.createShaderModule();
            this.pipeline = this.settingPipeline();
        });
        this.shaderModule = this.createShaderModule();
        this.pipeline = this.settingPipeline();
        this.camera = arg.camera;
        this.matrixBuffer = {
            buffer: this.device.createBuffer({
                size: wgslStructSize(SHADER_MATRIX_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.cameraBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.matrialBuffer = {
            buffer: this.device.createBuffer({
                size: wgslStructSize(SHADER_MATRIAL_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
    }
    createShaderModule() {
        return this.device.createShaderModule({
            code: this.shaderGadgetModule.getSourceCode(),
        });
    }
    settingPipeline() {
        const pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.shaderGadgetModule.getVsEntryPoint(),
                module: this.shaderModule,
                buffers: this.shaderGadgetModule.getVertexLayout(),
            },
            fragment: {
                entryPoint: this.shaderGadgetModule.getFsEntryPoint(),
                module: this.shaderModule,
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
        return pipeline;
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
        return this.shaderGadgetModule.module.fragment.shaderLights[0];
    }
    get ambientLightGadget() {
        return this.shaderGadgetModule.module.fragment.shaderLights[1];
    }
    get directionalLightGadget() {
        return this.shaderGadgetModule.module.fragment.shaderLights[2];
    }
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
        pass.setPipeline(this.pipeline);
        if (this.bindGroup) {
            pass.setBindGroup(0, this.bindGroup);
        }
        if (this.bindGroupTex) {
            pass.setBindGroup(1, this.bindGroupTex);
        }
        if (this.bindGroupSampler) {
            pass.setBindGroup(2, this.bindGroupSampler);
        }
        if (this.lihgtUpdate) {
            this.lightEntries = this.shaderGadgetModule.module.fragment.getBindGroupEntry();
            this.lihgtUpdate = false;
        }
        this.meshs.forEach((mesh) => {
            createMatrix(mesh, this.camera, aspect, this.device, this.matrixBuffer);
            this.device.queue.writeBuffer(this.cameraBuffer.buffer, 0, new Float32Array([
                this.camera.position.x,
                this.camera.position.y,
                this.camera.position.z,
                1,
            ]));
            this.device.queue.writeBuffer(this.matrialBuffer.buffer, 0, new Float32Array(mesh.matrial.getDataArray()));
            this.bindGroupMatrix = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(3),
                entries: [
                    { binding: 0, resource: { buffer: this.matrixBuffer.buffer } },
                    { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
                    { binding: 2, resource: { buffer: this.matrialBuffer.buffer } },
                    ...this.lightEntries,
                ],
            });
            pass.setBindGroup(3, this.bindGroupMatrix);
            pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
            pass.drawIndexed(mesh.geometry.indexs.length);
        });
        pass.end();
    }
}
//# sourceMappingURL=render_3d_pass.js.map