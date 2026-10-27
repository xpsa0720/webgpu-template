const SHADOW_MAP_SIZE = 2048;
/**
 * Shadow 관련 GPU 리소스를 중앙 관리하는 클래스.
 * group(3) binding 20~24에 해당하는 리소스를 생성/갱신/바인딩한다.
 */
export class ShadowResources {
    device;
    // binding 20: sampler_comparison
    sampler;
    // binding 21: directional shadow depth texture array
    directionalTexture;
    // binding 22: directional light PV matrix storage buffer
    directionalPvMatrixBuffer;
    // binding 23: point shadow depth texture array
    pointTexture;
    // binding 24: point light PV matrix storage buffer
    pointPvMatrixBuffer;
    // 현재 할당된 castShadow light 수 (재생성 판단용)
    directionalCount = 0;
    pointCount = 0;
    constructor(device) {
        this.device = device;
        this.sampler = device.createSampler({
            compare: "less",
            magFilter: "linear",
            minFilter: "linear",
        });
    }
    update(shaderLights) {
        let dirCount = 0;
        let ptCount = 0;
        for (const gadget of Object.values(shaderLights)) {
            if (!isShadowGadget(gadget))
                continue;
            for (const light of gadget.lights) {
                if (!isLightShadow(light))
                    continue;
                if (!light.castShadow)
                    continue;
                if (gadget.shadowTextureDefine.includes("directional")) {
                    dirCount++;
                }
                else {
                    ptCount++;
                }
            }
        }
        // directional shadow 리소스
        if (dirCount !== this.directionalCount) {
            this.directionalTexture?.destroy();
            this.directionalPvMatrixBuffer?.destroy();
            this.directionalTexture = undefined;
            this.directionalPvMatrixBuffer = undefined;
            if (dirCount > 0) {
                this.directionalTexture = this.device.createTexture({
                    size: [SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, dirCount],
                    format: "depth32float",
                    usage: GPUTextureUsage.RENDER_ATTACHMENT |
                        GPUTextureUsage.TEXTURE_BINDING,
                });
                // mat4x4f = 64 bytes
                this.directionalPvMatrixBuffer = this.device.createBuffer({
                    size: 64 * dirCount,
                    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
                });
            }
            this.directionalCount = dirCount;
        }
        // point shadow 리소스
        if (ptCount !== this.pointCount) {
            this.pointTexture?.destroy();
            this.pointPvMatrixBuffer?.destroy();
            this.pointTexture = undefined;
            this.pointPvMatrixBuffer = undefined;
            if (ptCount > 0) {
                this.pointTexture = this.device.createTexture({
                    size: [SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, ptCount],
                    format: "depth32float",
                    usage: GPUTextureUsage.RENDER_ATTACHMENT |
                        GPUTextureUsage.TEXTURE_BINDING,
                });
                this.pointPvMatrixBuffer = this.device.createBuffer({
                    size: 64 * ptCount,
                    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
                });
            }
            this.pointCount = ptCount;
        }
    }
    /**
     * castShadow인 light들의 PV matrix를 storage buffer에 기록한다.
     */
    writePvMatrices(shaderLights) {
        let dirIdx = 0;
        let ptIdx = 0;
        for (const gadget of Object.values(shaderLights)) {
            if (!isShadowGadget(gadget))
                continue;
            const isDir = gadget.shadowTextureDefine.includes("directional");
            for (const light of gadget.lights) {
                if (!isLightShadow(light))
                    continue;
                if (!light.castShadow)
                    continue;
                if (light.dirty)
                    light.updateMatrix();
                const data = light.pvMatrix.getArrayData();
                if (isDir && this.directionalPvMatrixBuffer) {
                    this.device.queue.writeBuffer(this.directionalPvMatrixBuffer, dirIdx * 64, data);
                    dirIdx++;
                }
                else if (!isDir && this.pointPvMatrixBuffer) {
                    this.device.queue.writeBuffer(this.pointPvMatrixBuffer, ptIdx * 64, data);
                    ptIdx++;
                }
            }
        }
    }
    /**
     * 바인드 그룹 엔트리 배열 반환.
     * 셰이더에 shadow 바인딩이 선언된 경우에만 호출되므로,
     * 실제 리소스가 존재하는 바인딩만 반환한다.
     */
    getBindGroupEntries() {
        const entries = [];
        // shadow 리소스가 하나도 없으면 빈 배열 (셰이더에도 바인딩 선언 없음)
        if (this.directionalCount === 0 && this.pointCount === 0) {
            return entries;
        }
        // binding 20: shadowSampler
        entries.push({
            binding: 20,
            resource: this.sampler,
        });
        // binding 21, 22: directional shadow
        if (this.directionalTexture && this.directionalPvMatrixBuffer) {
            entries.push({
                binding: 21,
                resource: this.directionalTexture.createView({ dimension: "2d-array" }),
            });
            entries.push({
                binding: 22,
                resource: { buffer: this.directionalPvMatrixBuffer },
            });
        }
        // binding 23, 24: point shadow
        if (this.pointTexture && this.pointPvMatrixBuffer) {
            entries.push({
                binding: 23,
                resource: this.pointTexture.createView({ dimension: "2d-array" }),
            });
            entries.push({
                binding: 24,
                resource: { buffer: this.pointPvMatrixBuffer },
            });
        }
        return entries;
    }
}
function isShadowGadget(gadget) {
    return "getShadowDefinesCode" in gadget;
}
function isLightShadow(light) {
    return (typeof light.castShadow === "boolean" &&
        typeof light.updateMatrix === "function");
}
//# sourceMappingURL=shadow_resources.js.map