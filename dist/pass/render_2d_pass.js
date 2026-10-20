import { vertexLayoutFromWGSL, } from "../util/vertex_layout";
import { Pass } from "./pass";
import { RenderPass } from "./render_pass";
export class Render2DPass extends RenderPass {
    shaderCode;
    shaderModule;
    vertexEntryPoint;
    fragmentEntryPoint;
    vertexCount;
    instanceCount;
    constructor(arg) {
        if (!arg.device) {
            throw Error("Device not initialized");
        }
        super(arg);
        this.shaderCode = arg.shaderCode;
        // this.buffers = [];
        this.vertexCount = arg.vertexCount;
        this.instanceCount = arg.instanceCount;
        this.vertexEntryPoint = arg.vertexEntryPoint;
        this.fragmentEntryPoint = arg.fragmentEntryPoint;
        this.shaderModule = this.device.createShaderModule({
            code: this.shaderCode,
        });
        this.pipeline = this.settingPipeline();
    }
    settingPipeline(shaderCode) {
        if (shaderCode) {
            this.shaderModule = this.device.createShaderModule({
                code: shaderCode,
            });
            this.shaderCode = shaderCode;
        }
        const pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: this.vertexEntryPoint,
                module: this.shaderModule,
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
            primitive: {
                topology: "triangle-list",
            },
        });
        return pipeline;
    }
    deleteBuffer(bindigIdx) {
        if (!this.entries[bindigIdx]) {
            throw Error("No buffer at this binding index");
        }
        delete this.entries[bindigIdx];
    }
    encoderWriteCommand(encoder, renderPassDescriptor) {
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        if (this.bindGroupTex) {
            pass.setBindGroup(1, this.bindGroupTex);
        }
        if (this.bindGroupSampler) {
            pass.setBindGroup(2, this.bindGroupSampler);
        }
        pass.draw(this.vertexCount, this.instanceCount == 0 ? 1 : this.instanceCount);
        pass.end();
    }
}
//# sourceMappingURL=render_2d_pass.js.map