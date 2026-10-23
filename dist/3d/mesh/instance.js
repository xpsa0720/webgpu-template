import { SHADER_MATRIAL_STRUCT } from "../../shader/gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIX_STRUCT } from "../../shader/gadget/code/shader_instance";
import { distance, wgslStructSize } from "../../util/math";
import { createModelMatrixData } from "../../util/matrix";
import { Vector3 } from "../math/vector";
const RANDOM_RANGE = 100;
export class InstanceMesh {
    render3DPass;
    count;
    instanceInfo;
    geometry;
    matrixBuffer;
    matrialBuffer;
    dirty = true;
    AabbCenter;
    AabbRadius;
    constructor({ instanceInfo = [], geometry, render3DPass, }) {
        this.render3DPass = render3DPass;
        this.instanceInfo = instanceInfo;
        this.count = instanceInfo.length;
        this.geometry = geometry;
        this.AABB();
        this.matrixBuffer = this.createBuffer(SHADER_INSTANCE_MATRIX_STRUCT);
        this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
        this.writeBuffers();
    }
    markDirty() {
        this.dirty = true;
    }
    update() {
        if (this.count !== this.instanceInfo.length) {
            this.matrixBuffer.buffer.destroy();
            this.matrialBuffer.buffer.destroy();
            this.count = this.instanceInfo.length;
            this.matrixBuffer = this.createBuffer(SHADER_INSTANCE_MATRIX_STRUCT);
            this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
            this.dirty = true;
        }
        if (!this.dirty || this.count === 0)
            return;
        this.writeBuffers();
        this.dirty = false;
    }
    writeBuffers() {
        if (this.count === 0)
            return;
        const matrixStride = wgslStructSize(SHADER_INSTANCE_MATRIX_STRUCT) / 4;
        const matrialStride = wgslStructSize(SHADER_MATRIAL_STRUCT) / 4;
        const matrixData = new Float32Array(matrixStride * this.count);
        const matrialData = new Float32Array(matrialStride * this.count);
        this.instanceInfo.forEach((info, i) => {
            matrixData.set(createModelMatrixData(info), i * matrixStride);
            matrialData.set(info.matrial.getDataArray(), i * matrialStride);
        });
        const queue = this.render3DPass.device.queue;
        queue.writeBuffer(this.matrixBuffer.buffer, 0, matrixData);
        queue.writeBuffer(this.matrialBuffer.buffer, 0, matrialData);
    }
    createBuffer(struct) {
        return {
            buffer: this.render3DPass.device.createBuffer({
                size: wgslStructSize(struct) * this.count,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            }),
        };
    }
    static randomInstanceInfo(count, matrial) {
        const random = () => (Math.random() * 2 - 1) * RANDOM_RANGE;
        return Array.from({ length: count }, () => ({
            location: new Vector3(random(), random(), random()),
            rotate: new Vector3(0, 0, 0),
            scale: new Vector3(1, 1, 1),
            matrial,
        }));
    }
    AABB() {
        let min = new Vector3(Infinity, Infinity, Infinity);
        let max = new Vector3(-Infinity, -Infinity, -Infinity);
        let maxDistance = -Infinity;
        this.geometry.vertex.forEach((e) => {
            min = Vector3.min(min, e.location);
            max = Vector3.max(max, e.location);
        });
        this.AabbCenter = new Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
        this.geometry.vertex.forEach((e) => {
            const d = distance(e.location, this.AabbCenter);
            maxDistance = Math.max(maxDistance, d);
        });
        this.AabbRadius = maxDistance;
    }
}
//# sourceMappingURL=instance.js.map