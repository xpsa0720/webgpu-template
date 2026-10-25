import { SHADER_MATRIAL_STRUCT } from "../../../shader/gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIX_STRUCT } from "../../../shader/gadget/code/shader_instance";
import { distance, extractFrustumPlanes, isOutsideFrustum, wgslStructSize } from "../../../util/math";
import { createModelMatrixData } from "../../../util/matrix";
import { Vector3 } from "../../math/vector";
const RANDOM_RANGE = 100;
const MATRIX_STRIDE = wgslStructSize(SHADER_INSTANCE_MATRIX_STRUCT) / 4;
const MATRIAL_STRIDE = wgslStructSize(SHADER_MATRIAL_STRUCT) / 4;
export class InstanceMesh {
    render3DPass;
    count;
    renderCount;
    instanceInfo;
    geometry;
    matrixBuffer;
    matrialBuffer;
    cachedBindGroup = null;
    AabbCenter;
    AabbRadius;
    // 인스턴스별 미리 계산된 데이터 캐시
    cachedMatrixData;
    cachedMatrialData;
    positions;
    // 인덱스 배열: swap 시 실제 데이터 대신 인덱스만 교환
    indices;
    dirty = true;
    constructor({ instanceInfo = [], geometry, render3DPass }) {
        this.render3DPass = render3DPass;
        this.instanceInfo = instanceInfo;
        this.count = instanceInfo.length;
        this.geometry = geometry;
        this.renderCount = 0;
        this.AABB();
        this.matrixBuffer = this.createBuffer(SHADER_INSTANCE_MATRIX_STRUCT);
        this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
        this.buildCache();
    }
    markDirty() {
        this.dirty = true;
    }
    // 캐시 배열 생성: 인스턴스별 matrix/material 데이터를 미리 계산
    buildCache() {
        this.cachedMatrixData = new Array(this.count);
        this.cachedMatrialData = new Array(this.count);
        this.positions = new Float64Array(this.count * 3);
        this.indices = new Uint32Array(this.count);
        for (let i = 0; i < this.count; i++) {
            this.cachedMatrixData[i] = createModelMatrixData(this.instanceInfo[i]);
            this.cachedMatrialData[i] = this.instanceInfo[i].matrial.getDataArray();
            const loc = this.instanceInfo[i].location;
            this.positions[i * 3] = loc.x;
            this.positions[i * 3 + 1] = loc.y;
            this.positions[i * 3 + 2] = loc.z;
            this.indices[i] = i;
        }
        this.dirty = false;
    }
    frustumCull(PV) {
        if (this.dirty)
            this.buildCache();
        const planes = extractFrustumPlanes(PV);
        const cx = this.AabbCenter.x;
        const cy = this.AabbCenter.y;
        const cz = this.AabbCenter.z;
        const r = this.AabbRadius;
        const pos = this.positions;
        const idx = this.indices;
        let visible = 0;
        for (let i = 0; i < this.count; i++) {
            const ii = idx[i];
            const o = ii * 3;
            if (!isOutsideFrustum(planes, cx + pos[o], cy + pos[o + 1], cz + pos[o + 2], r)) {
                if (i !== visible) {
                    // 인덱스만 swap
                    const tmp = idx[visible];
                    idx[visible] = idx[i];
                    idx[i] = tmp;
                }
                visible++;
            }
        }
        this.renderCount = visible;
        this.writeVisibleBuffers();
    }
    writeAll() {
        if (this.dirty)
            this.buildCache();
        this.renderCount = this.count;
        // indices를 순서대로 복원
        for (let i = 0; i < this.count; i++)
            this.indices[i] = i;
        this.writeVisibleBuffers();
    }
    writeVisibleBuffers() {
        if (this.renderCount === 0)
            return;
        const matrixData = new Float32Array(MATRIX_STRIDE * this.renderCount);
        const matrialData = new Float32Array(MATRIAL_STRIDE * this.renderCount);
        const idx = this.indices;
        for (let i = 0; i < this.renderCount; i++) {
            const ii = idx[i];
            matrixData.set(this.cachedMatrixData[ii], i * MATRIX_STRIDE);
            matrialData.set(this.cachedMatrialData[ii], i * MATRIAL_STRIDE);
        }
        const queue = this.render3DPass.device.queue;
        queue.writeBuffer(this.matrixBuffer.buffer, 0, matrixData);
        queue.writeBuffer(this.matrialBuffer.buffer, 0, matrialData);
    }
    update() {
        if (this.count !== this.instanceInfo.length) {
            this.matrixBuffer.buffer.destroy();
            this.matrialBuffer.buffer.destroy();
            this.count = this.instanceInfo.length;
            this.matrixBuffer = this.createBuffer(SHADER_INSTANCE_MATRIX_STRUCT);
            this.matrialBuffer = this.createBuffer(SHADER_MATRIAL_STRUCT);
            this.cachedBindGroup = null;
            this.dirty = true;
        }
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
            scale: new Vector3(0.1, 0.1, 0.1),
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