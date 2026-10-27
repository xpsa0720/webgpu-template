import { SHADER_MESH_MATRIX_STRUCT } from "../shader/gadget/code/shader_code";
import { FORMAT_TABLE } from "../shader/gadget/shader_vertex";
import { gpuBufferSizeFormat, isView } from "../util/math";
import { createMatrix, createModelMatrix, createModelMatrixData, } from "../util/matrix";
import { Pass } from "./pass";
const shadowShader = `
struct VertexOut{
  @builtin(position) position:vec4f,
}

// 임시 테스트: mesh.matrixBuffer(Main Pass와 같은 Matrixs struct)를 그대로 바인딩
${SHADER_MESH_MATRIX_STRUCT}
@group(0) @binding(0) var<uniform> matrix: Matrixs;
@group(0) @binding(1) var<uniform> vpMatrix:mat4x4<f32>;

@vertex
fn vs(@location(0) pos: vec3f) -> VertexOut {
  var out:VertexOut;
  out.position = vpMatrix * matrix.modelMatrix * vec4f(pos,1);

  return out;
}

@fragment
fn fs(out: VertexOut) {}
`;
export class ShadowPass extends Pass {
    render3DPass;
    device;
    shadowShaderPipeline;
    shadowShaderModule;
    blendState;
    lightVpBuffer;
    debugMode;
    constructor(arg) {
        super(arg);
        this.render3DPass = arg.render3DPass;
        this.debugMode = arg.debugMode ?? false;
        this.device = arg.device;
        this.lightVpBuffer = {
            buffer: this.device.createBuffer({
                size: 16 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.shadowShaderModule = this.device.createShaderModule({
            code: shadowShader,
        });
        this.settingPipeline();
    }
    settingPipeline() {
        const mesh_pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                entryPoint: "vs",
                module: this.shadowShaderModule,
                buffers: [
                    {
                        arrayStride: gpuBufferSizeFormat(FORMAT_TABLE["float32x3"].byteSize * 2 +
                            FORMAT_TABLE["float32x2"].byteSize),
                        stepMode: "vertex",
                        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
                    },
                ],
            },
            fragment: {
                entryPoint: "fs",
                module: this.shadowShaderModule,
                targets: [],
            },
            depthStencil: {
                format: "depth32float",
                depthWriteEnabled: true,
                depthCompare: "less-equal",
                depthBias: 2,
                depthBiasSlopeScale: 2.0,
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "ccw",
                cullMode: "back",
            },
        });
        this.shadowShaderPipeline = mesh_pipeline;
        return mesh_pipeline;
    }
    encoderWriteCommand(encoder) {
        const shadowRes = this.render3DPass.shadowResources;
        // directional shadow 렌더링
        if (shadowRes.directionalTexture && shadowRes.directionalCount > 0) {
            // 순서 = ShadowResources.getShadowLights → PV 버퍼 칸
            const dirLights = shadowRes.getShadowLights(this.render3DPass.shaderLights, "directional");
            let layerIdx = 0;
            for (const light of dirLights) {
                encoder.copyBufferToBuffer(shadowRes.directionalPvMatrixBuffer, layerIdx * 64, this.lightVpBuffer.buffer, 0, 64);
                const layerView = shadowRes.directionalTexture.createView({
                    dimension: "2d",
                    baseArrayLayer: layerIdx,
                    arrayLayerCount: 1,
                });
                const renderPassDescriptor = {
                    colorAttachments: [],
                    depthStencilAttachment: {
                        view: layerView,
                        depthClearValue: 1.0,
                        depthLoadOp: "clear",
                        depthStoreOp: "store",
                    },
                };
                encoder.copyBufferToBuffer(shadowRes.directionalPvMatrixBuffer, layerIdx * 64, this.lightVpBuffer.buffer, 0, 64);
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setViewport(0, 0, shadowRes.directionalTexture.width, shadowRes.directionalTexture.height, 0, 1);
                pass.setPipeline(this.shadowShaderPipeline);
                this.render3DPass.meshs.forEach((mesh) => {
                    const bindGroup = this.device.createBindGroup({
                        layout: this.shadowShaderPipeline.getBindGroupLayout(0),
                        entries: [
                            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                            { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
                        ],
                    });
                    pass.setBindGroup(0, bindGroup);
                    pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
                    pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
                    pass.drawIndexed(mesh.geometry.indexs.length);
                });
                this.nodeRecursionRender(this.render3DPass.nodes, light.pvMatrix, pass);
                pass.end();
                layerIdx++;
            }
        }
        // point shadow 렌더링
        if (shadowRes.pointTexture && shadowRes.pointCount > 0) {
            const pointLights = shadowRes.getShadowLights(this.render3DPass.shaderLights, "point");
            let layerIdx = 0;
            for (const light of pointLights) {
                encoder.copyBufferToBuffer(shadowRes.pointPvMatrixBuffer, layerIdx * 64, this.lightVpBuffer.buffer, 0, 64);
                const layerView = shadowRes.pointTexture.createView({
                    dimension: "2d",
                    baseArrayLayer: layerIdx,
                    arrayLayerCount: 1,
                });
                const renderPassDescriptor = {
                    colorAttachments: [],
                    depthStencilAttachment: {
                        view: layerView,
                        depthClearValue: 1.0,
                        depthLoadOp: "clear",
                        depthStoreOp: "store",
                    },
                };
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setViewport(0, 0, shadowRes.pointTexture.width, shadowRes.pointTexture.height, 0, 1);
                pass.setPipeline(this.shadowShaderPipeline);
                this.render3DPass.meshs.forEach((mesh) => {
                    const bindGroup = this.device.createBindGroup({
                        layout: this.shadowShaderPipeline.getBindGroupLayout(0),
                        entries: [
                            { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                            { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
                        ],
                    });
                    pass.setBindGroup(0, bindGroup);
                    pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
                    pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
                    pass.drawIndexed(mesh.geometry.indexs.length);
                });
                this.nodeRecursionRender(this.render3DPass.nodes, light.pvMatrix, pass);
                pass.end();
                layerIdx++;
            }
        }
    }
    nodeRecursionRender(nodes, vpMatrix, pass) {
        nodes.forEach((node) => {
            node.meshs.forEach((mesh) => {
                const M = createModelMatrix(mesh).multiply(node.worldMat);
                if (isView(vpMatrix, mesh.AabbCenter, mesh.AabbRadius, M))
                    return;
                const bindGroup = this.device.createBindGroup({
                    layout: this.shadowShaderPipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: mesh.matrixBuffer.buffer } },
                        { binding: 1, resource: { buffer: this.lightVpBuffer.buffer } },
                    ],
                });
                pass.setBindGroup(0, bindGroup);
                pass.setVertexBuffer(0, mesh.geometry.vertexBuffer.buffer);
                pass.setIndexBuffer(mesh.geometry.indexBuffer.buffer, "uint32");
                pass.drawIndexed(mesh.geometry.indexs.length);
            });
            if (node.children.length > 0)
                this.nodeRecursionRender(node.children, vpMatrix, pass);
        });
    }
    createPass(encoder, debugArg) {
        this.encoderWriteCommand(encoder);
        return [];
    }
    /**
     * shadow map depth 텍스처를 CPU로 읽어와서 콘솔에 출력.
     * 한 번만 호출하면 됨 (매 프레임 호출하면 느림).
     * 중앙 sampleSize x sampleSize 영역의 depth 값을 출력.
     */
    /**
     * 디버그: shadow map 텍스처 배열의 layer 수와, 각 layer의 가운데 열(x = width/2, y = 0..height-1) depth 값을 출력.
     * depth 텍스처는 부분 복사가 불가능해서 layer 전체를 읽은 뒤 가운데 열만 뽑는다.
     */
    async readShadowMapColumns() {
        const res = this.render3DPass.shadowResources;
        console.log(`[ShadowMap] layer 수 — directional: ${res.directionalCount}, point: ${res.pointCount}`);
        const targets = [
            ["directional", res.directionalTexture],
            ["point", res.pointTexture],
        ];
        for (const [name, texture] of targets) {
            if (!texture)
                continue;
            const w = texture.width;
            const h = texture.height;
            const layers = texture.depthOrArrayLayers;
            const bytesPerRow = Math.ceil((w * 4) / 256) * 256; // depth32float, 256 정렬
            const layerSize = bytesPerRow * h;
            const readBuffer = this.device.createBuffer({
                size: layerSize * layers,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            const encoder = this.device.createCommandEncoder();
            encoder.copyTextureToBuffer({ texture, aspect: "depth-only" }, { buffer: readBuffer, bytesPerRow, rowsPerImage: h }, { width: w, height: h, depthOrArrayLayers: layers });
            this.device.queue.submit([encoder.finish()]);
            await readBuffer.mapAsync(GPUMapMode.READ);
            const data = new Float32Array(readBuffer.getMappedRange().slice(0));
            readBuffer.unmap();
            readBuffer.destroy();
            const cx = Math.floor(w / 2);
            const floatsPerRow = bytesPerRow / 4;
            const floatsPerLayer = layerSize / 4;
            for (let layer = 0; layer < layers; layer++) {
                const column = new Float32Array(h);
                for (let y = 0; y < h; y++) {
                    column[y] = data[layer * floatsPerLayer + y * floatsPerRow + cx];
                }
                let min = Infinity, max = -Infinity, nonOne = 0;
                for (const v of column) {
                    if (v < min)
                        min = v;
                    if (v > max)
                        max = v;
                    if (v < 0.9999)
                        nonOne++;
                }
                const step = Math.max(1, Math.floor(h / 16));
                const summary = [];
                for (let y = 0; y < h; y += step)
                    summary.push(`y${y}:${column[y].toFixed(4)}`);
                console.groupCollapsed(`[ShadowMap] ${name} layer ${layer} 가운데 열 x=${cx} — min ${min.toFixed(4)}, max ${max.toFixed(4)}, 1.0 아닌 픽셀 ${nonOne}/${h}`);
                console.log(summary.join("  "));
                console.log(column);
                console.groupEnd();
            }
        }
    }
    async readShadowMap(sampleSize = 8) {
        const shadowTexture = this.render3DPass.shadowResources.directionalTexture ??
            this.render3DPass.shadowResources.pointTexture;
        if (!shadowTexture) {
            console.warn("[ShadowPass] shadow map 텍스처 없음");
            return;
        }
        const w = shadowTexture.width;
        const h = shadowTexture.height;
        // depth32float = 4 bytes per pixel
        const bytesPerRow = Math.ceil((w * 4) / 256) * 256; // 256 정렬
        const bufferSize = bytesPerRow * h;
        const readBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        const encoder = this.device.createCommandEncoder();
        encoder.copyTextureToBuffer({ texture: shadowTexture }, { buffer: readBuffer, bytesPerRow, rowsPerImage: h }, { width: w, height: h });
        this.device.queue.submit([encoder.finish()]);
        await readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();
        readBuffer.destroy();
        // 중앙 영역 샘플링
        const cx = Math.floor(w / 2);
        const cy = Math.floor(h / 2);
        const half = Math.floor(sampleSize / 2);
        const floatsPerRow = bytesPerRow / 4;
        // 통계 + 1.0이 아닌 값 수집
        let min = Infinity, max = -Infinity;
        let nonOneCount = 0;
        const nonOnePixels = [];
        const totalPixels = w * h;
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                const v = data[i * floatsPerRow + j];
                if (v < min)
                    min = v;
                if (v > max)
                    max = v;
                if (v < 0.9999) {
                    nonOneCount++;
                    if (nonOnePixels.length < 20) {
                        nonOnePixels.push({ x: j, y: i, v });
                    }
                }
            }
        }
        console.group(`[ShadowMap] ${w}x${h} depth 분석`);
        console.log(`min: ${min.toFixed(6)}, max: ${max.toFixed(6)}`);
        console.log(`depth < 1.0 픽셀: ${nonOneCount} / ${totalPixels} (${((nonOneCount / totalPixels) * 100).toFixed(2)}%)`);
        if (nonOnePixels.length > 0) {
            console.log("1.0이 아닌 픽셀 샘플 (최대 20개):");
            nonOnePixels.forEach((p) => console.log(`  (${p.x}, ${p.y}) = ${p.v.toFixed(6)}`));
        }
        else {
            console.log("⚠ 모든 픽셀이 1.0 — shadow map에 아무것도 그려지지 않음");
        }
        console.groupEnd();
    }
}
//# sourceMappingURL=shadow_pass.js.map