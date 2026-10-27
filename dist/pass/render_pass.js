import { vertexLayoutFromWGSL, } from "../util/vertex_layout";
import { Pass } from "./pass";
export class RenderPass extends Pass {
    target;
    context;
    entries;
    device;
    meshRenderShaderPipeline;
    loadOp;
    format;
    blendState;
    debugMode;
    bindGroup = null;
    bindGroupTex = null;
    bindGroupSampler = null;
    constructor(arg) {
        if (!arg.device) {
            throw Error("Device not initialized");
        }
        super(arg);
        this.debugMode = arg.debugMode ?? false;
        this.target = arg.target;
        this.context = null;
        if (this.target instanceof HTMLCanvasElement) {
            this.context = this.target.getContext("webgpu");
            const canvas = this.target;
            const resizeObserver = new ResizeObserver(() => {
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * devicePixelRatio;
                canvas.height = rect.height * devicePixelRatio;
            });
            resizeObserver.observe(canvas);
        }
        this.device = arg.device;
        this.loadOp = arg.loadOp ?? "clear";
        const presentationFormat = arg.format ?? navigator.gpu.getPreferredCanvasFormat();
        this.format =
            this.target instanceof HTMLCanvasElement
                ? presentationFormat
                : this.target.format;
        this.blendState = arg.blend
            ? {
                color: {
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                },
                alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add",
                },
            }
            : undefined;
        this.buffers = [];
        this.entries = [];
    }
    deleteBuffer(bindigIdx) {
        if (!this.entries[bindigIdx]) {
            throw Error("No buffer at this binding index");
        }
        delete this.entries[bindigIdx];
    }
    ensureBindGroups() {
        if (!this.bindGroup) {
            const entries = [];
            for (const [key, value] of Object.entries(this.buffers)) {
                entries.push({
                    binding: Number(key),
                    resource: { buffer: value.buffer },
                });
            }
            this.bindGroup = this.device.createBindGroup({
                layout: this.meshRenderShaderPipeline.getBindGroupLayout(0),
                entries: entries,
            });
        }
        if (!this.bindGroupTex && Object.keys(this.textures).length > 0) {
            const entries_tex = [];
            for (const [key, value] of Object.entries(this.textures)) {
                entries_tex.push({
                    binding: Number(key),
                    resource: value.texture.createView(),
                });
            }
            this.bindGroupTex = this.device.createBindGroup({
                layout: this.meshRenderShaderPipeline.getBindGroupLayout(1),
                entries: entries_tex,
            });
        }
        if (!this.bindGroupSampler && Object.keys(this.sampler).length > 0) {
            const entries_sampler = [];
            for (const [key, value] of Object.entries(this.sampler)) {
                entries_sampler.push({
                    binding: Number(key),
                    resource: value.sampler,
                });
            }
            this.bindGroupSampler = this.device.createBindGroup({
                layout: this.meshRenderShaderPipeline.getBindGroupLayout(2),
                entries: entries_sampler,
            });
        }
    }
    createPass(encoder, debugArg) {
        this.ensureBindGroups();
        const view = this.context
            ? this.context.getCurrentTexture().createView()
            : this.target.createView();
        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: view,
                    loadOp: this.loadOp,
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
        };
        if (debugArg?.time && this.debugMode) {
            renderPassDescriptor.timestampWrites = {
                querySet: debugArg.querySet,
                beginningOfPassWriteIndex: debugArg.time?.startIndex ?? undefined,
                endOfPassWriteIndex: debugArg.time?.endIndex ?? undefined,
            };
        }
        this.encoderWriteCommand(encoder, renderPassDescriptor);
        return super.createPass(encoder);
    }
}
//# sourceMappingURL=render_pass.js.map