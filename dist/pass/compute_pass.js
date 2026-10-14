import { Pass } from "./pass";
import { resolveWorkgroupSize } from "./workgroup_size";
export class ComputePass extends Pass {
    workgroupSizeX;
    workgroupSizeY;
    workgroupSizeZ;
    autoWorkgroupSize;
    shaderCodeTemplate;
    computeTargetCountX;
    computeTargetCountY;
    computeTargetCountZ;
    pipeline;
    debugMode;
    bindGroup = null;
    bindGroupTex = null;
    bindGroupSampler = null;
    constructor(arg) {
        const resolved = resolveWorkgroupSize(arg.shaderCode, arg.entryPoint, arg.label ?? "");
        super({ ...arg, shaderCode: resolved.shaderCode });
        if (!arg.device) {
            throw Error("Device not initialized");
        }
        this.debugMode = arg.debugMode ?? false;
        this.shaderCodeTemplate = arg.shaderCode;
        this.autoWorkgroupSize = resolved.isAuto;
        [this.workgroupSizeX, this.workgroupSizeY, this.workgroupSizeZ] = resolved.sizes;
        this.computeTargetCountX = arg.computeTargetCountX;
        this.computeTargetCountY = arg.computeTargetCountY ?? 0;
        this.computeTargetCountZ = arg.computeTargetCountZ ?? 0;
        this.pipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: {
                entryPoint: arg.entryPoint,
                module: this.shaderModule,
            },
        });
    }
    createPass(encoder, debugArg) {
        this.preEncoderCallback?.(encoder);
        if (!this.bindGroup) {
            const entries = [];
            for (const [key, value] of Object.entries(this.buffers)) {
                entries.push({
                    binding: Number(key),
                    resource: { buffer: value.buffer },
                });
            }
            this.bindGroup = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
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
                layout: this.pipeline.getBindGroupLayout(1),
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
                layout: this.pipeline.getBindGroupLayout(2),
                entries: entries_sampler,
            });
        }
        const passArg = debugArg?.time && this.debugMode
            ? {
                timestampWrites: {
                    querySet: debugArg.querySet,
                    beginningOfPassWriteIndex: debugArg.time?.startIndex,
                    endOfPassWriteIndex: debugArg.time?.endIndex,
                },
            }
            : {};
        const pass = encoder.beginComputePass(passArg);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        if (this.bindGroupTex) {
            pass.setBindGroup(1, this.bindGroupTex);
        }
        if (this.bindGroupSampler) {
            pass.setBindGroup(2, this.bindGroupSampler);
        }
        pass.dispatchWorkgroups(this.dispatchCount(this.computeTargetCountX, this.workgroupSizeX) ?? 0, this.dispatchCount(this.computeTargetCountY, this.workgroupSizeY), this.dispatchCount(this.computeTargetCountZ, this.workgroupSizeZ));
        pass.end();
        return super.createPass(encoder);
    }
    dispatchCount(count, size) {
        if (count <= 0 || size === 0)
            return undefined;
        return Math.ceil(count / size);
    }
}
//# sourceMappingURL=compute_pass.js.map