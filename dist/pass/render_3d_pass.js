import { ShaderGadgetModule } from "../shader/core/shader_module";
import { createMatrix } from "../util/matrix";
import { vertexLayoutFromWGSL, } from "../util/vertex_layout";
import { Pass } from "./pass";
import { RenderPass } from "./render_pass";
export class Render3DPass extends RenderPass {
    meshs;
    // lights: Light[];
    camera;
    matrixBuffer;
    cameraBuffer;
    shaderGadgetModule;
    shaderModule;
    pipeline;
    // vertexLayout: VertexLayout;
    bindGroupMatrix = null;
    depthTexture = null;
    depthWidth = 0;
    depthHeight = 0;
    constructor(arg) {
        super(arg);
        this.meshs = arg.meshs ?? [];
        // this.lights = arg.lights ?? [];
        this.shaderGadgetModule = new ShaderGadgetModule();
        this.shaderModule = this.createShaderModule();
        this.pipeline = this.settingPipeline();
        this.camera = arg.camera;
        this.matrixBuffer = {
            buffer: this.device.createBuffer({
                size: 16 * 2 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.cameraBuffer = {
            buffer: this.device.createBuffer({
                size: 4 * 4,
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
        this.meshs.forEach((mesh) => {
            createMatrix(mesh, this.camera, aspect, this.device, this.matrixBuffer);
            this.device.queue.writeBuffer(this.cameraBuffer.buffer, 0, new Float32Array([
                this.camera.position.x,
                this.camera.position.y,
                this.camera.position.z,
                1
            ]));
            this.bindGroupMatrix = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(3),
                entries: [
                    { binding: 0, resource: { buffer: this.matrixBuffer.buffer } },
                    // { binding: 1, resource: { buffer: this.cameraBuffer.buffer } },
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