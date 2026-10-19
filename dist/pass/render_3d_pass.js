import { createMatrix } from "../util/matrix";
import { vertexLayoutFromWGSL, } from "../util/vertex_layout";
import { RenderPass } from "./render_pass";
export class Render3DPass extends RenderPass {
    meshs;
    camera;
    bindGroupMatrix = null;
    depthTexture = null;
    depthWidth = 0;
    depthHeight = 0;
    constructor(arg) {
        super(arg);
        this.meshs = arg.meshs ?? [];
        this.pipeline = this.settingPipeline(arg);
        this.camera = arg.camera;
    }
    settingPipeline(arg) {
        const vertexLayout = vertexLayoutFromWGSL(this.shaderCode, this.vertexEntryPoint, arg.vertexLayoutOptions);
        const pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.vertexEntryPoint,
                module: this.shaderModule,
                buffers: vertexLayout.buffers,
            },
            fragment: {
                entryPoint: this.fragmentEntryPoint,
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
                cullMode: "back"
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
        if (!this.depthTexture || this.depthWidth !== width || this.depthHeight !== height) {
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
            const matrixBuffer = createMatrix(mesh, this.camera, aspect, this.device);
            this.bindGroupMatrix = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(3),
                entries: [{ binding: 0, resource: { buffer: matrixBuffer.buffer } }],
            });
            pass.setBindGroup(3, this.bindGroupMatrix);
            pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
            pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint16");
            pass.drawIndexed(mesh.geometry.indexs.length);
        });
        pass.end();
    }
    createPass(encoder, debugArg) {
        return super.createPass(encoder);
    }
}
//# sourceMappingURL=render_3d_pass.js.map