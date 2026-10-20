import { createOverlayElement } from "../debug/overlay";
import { printDefault } from "../debug/print";
import {
  createTimestampQuery,
  readTimestampLines,
  resolveTimestampQuery,
  type TimestampQuery,
} from "../debug/timestamp";
import { ComputePass } from "../pass/compute_pass";
import { Render3DPass } from "../pass/render_3d_pass";
import { Render2DPass } from "../pass/render_2d_pass";
import type { PassCallback } from "../types/callback";
import type {
  CreateComputePassArg,
  CreatePassTimeTag,
  CreateRender3DPassArg,
  CreateRenderPassArg,
  OutGPUBuffer,
} from "../types/pass";
import type { FormatStyle } from "../types/print";
import type {
  WebGPUBuffer,
  WebGPUSampler,
  WebGPUTexture,
} from "../types/resource";
import { loadImageBitmap } from "../util/load_image_bitmap";
import { DEFAULT_CONFIG, type WPConfig } from "./config";

interface WPArg {
  canvas: HTMLCanvasElement;
  config?: WPConfig;
}

export class WP<
  B extends Record<string, WebGPUBuffer> = Record<string, WebGPUBuffer>,
  T extends Record<string, WebGPUTexture> = Record<string, WebGPUTexture>,
  S extends Record<string, WebGPUSampler> = Record<string, WebGPUSampler>,
> {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  passes: Array<ComputePass | Render2DPass | Render3DPass>;
  config: Required<WPConfig>;
  timeDebugPass: number;
  timeDebugLabels: string[];
  totalFrame: number;
  fpsFrameCount: number;
  lastFpsLogTime: number;
  fpsElement: HTMLElement | null;
  timestampElement: HTMLElement | null;
  latestTimestampLines: string[];
  debugFrameCounter: number;

  constructor(arg: WPArg) {
    this.canvas = arg.canvas;
    this.config = { ...DEFAULT_CONFIG, ...arg.config };
    const ctx = this.canvas?.getContext("webgpu");
    if (!ctx) {
      throw new Error("Failed to get WebGPU context");
    }
    this.context = ctx;
    this.adapter = null;
    this.device = null;
    this.totalFrame = 0;
    this.fpsFrameCount = 0;
    this.lastFpsLogTime = 0;
    this.fpsElement = createOverlayElement("fps", "top:0;left:0");
    this.timestampElement = createOverlayElement(
      "timestamps",
      "top:20px;left:0",
    );
    this.latestTimestampLines = [];
    this.debugFrameCounter = 0;
    this.passes = [];
    this.timeDebugLabels = [];
    this.timeDebugPass = 0;
  }

  async init() {
    const presentationFormat: GPUTextureFormat =
      navigator.gpu.getPreferredCanvasFormat();
    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw Error("WebGPU is not supported in this browser");
    }
    const requiredFeatures: GPUFeatureName[] = [];
    if (this.adapter.features.has("timestamp-query")) {
      requiredFeatures.push("timestamp-query");
    }
    this.device = await this.adapter.requestDevice({ requiredFeatures });
    this.context.configure({
      device: this.device,
      format: presentationFormat,
    });
    this.device.lost.then((info) => {
      console.error(`GPU device lost: ${info.message}`);
    });
  }

  createComputePass(
    index: number,
    arg: CreateComputePassArg,
    time?: CreatePassTimeTag,
    encoderCallback?: (encoder: GPUCommandEncoder) => void,
    preEncoderCallback?: (encoder: GPUCommandEncoder) => void,
  ) {
    if (!this.device) {
      throw new Error("WP.init() must be called first");
    }
    if (
      time?.startIndex &&
      time?.endIndex &&
      time?.startIndex == time?.endIndex
    ) {
      throw new Error("startIndex and endIndex must not be equal");
    }
    if (typeof time?.startIndex === "number") {
      this.timeDebugPass += 1;
    }
    if (typeof time?.endIndex === "number") {
      this.timeDebugPass += 1;
    }

    const pass = new ComputePass({
      device: this.device,
      computeTargetCountX: arg.computeTargetCountX,
      computeTargetCountY: arg.computeTargetCountY,
      computeTargetCountZ: arg.computeTargetCountZ,
      entryPoint: arg.entryPoint,
      shaderCode: arg.shaderCode,
      label: arg.label,
      time: time,
      encoderCallback,
      preEncoderCallback,
      debugMode: this.config.debugMode,
    });
    if (typeof time?.startIndex == "number" && typeof time.label == "string") {
      this.timeDebugLabels.push(time.label);
    }
    this.passes[index] = pass;

    return pass;
  }

  createRenderPass(
    index: number,
    arg: CreateRenderPassArg,
    time?: CreatePassTimeTag,
    encoderCallback?: (encoder: GPUCommandEncoder) => void,
    preEncoderCallback?: (encoder: GPUCommandEncoder) => void,
  ) {
    if (!this.device) {
      throw new Error("WP.init() must be called first");
    }
    if (
      time?.startIndex &&
      time?.endIndex &&
      time?.startIndex == time?.endIndex
    ) {
      throw new Error("startIndex and endIndex must not be equal");
    }
    if (typeof time?.startIndex === "number") {
      this.timeDebugPass += 1;
    }
    if (typeof time?.endIndex === "number") {
      this.timeDebugPass += 1;
    }
    if (typeof time?.startIndex == "number" && typeof time.label == "string") {
      this.timeDebugLabels.push(time.label);
    }
    const pass = new Render2DPass({
      device: this.device,
      vertexEntryPoint: arg.vertexEntryPoint,
      fragmentEntryPoint: arg.fragmentEntryPoint,
      shaderCode: arg.shaderCode,
      label: arg.label,
      vertexCount: arg.vertexCount,
      instanceCount: arg.instanceCount,
      loadOp: arg.loadOp,
      time: time,
      encoderCallback,
      preEncoderCallback,
      target: arg.target,
      format: arg.format,
      debugMode: this.config.debugMode,
    });

    this.passes[index] = pass;

    return pass;
  }

  createRender3DPass(
    index: number,
    arg: CreateRender3DPassArg,
    time?: CreatePassTimeTag,
    encoderCallback?: (encoder: GPUCommandEncoder) => void,
    preEncoderCallback?: (encoder: GPUCommandEncoder) => void,
  ) {
    if (!this.device) {
      throw new Error("WP.init() must be called first");
    }
    if (
      time?.startIndex &&
      time?.endIndex &&
      time?.startIndex == time?.endIndex
    ) {
      throw new Error("startIndex and endIndex must not be equal");
    }
    if (typeof time?.startIndex === "number") {
      this.timeDebugPass += 1;
    }
    if (typeof time?.endIndex === "number") {
      this.timeDebugPass += 1;
    }
    if (typeof time?.startIndex == "number" && typeof time.label == "string") {
      this.timeDebugLabels.push(time.label);
    }
    const pass = new Render3DPass({
      device: this.device,
      label: arg.label,
      loadOp: arg.loadOp,
      time: time,
      encoderCallback,
      preEncoderCallback,
      target: arg.target,
      format: arg.format,
      blend: arg.blend,
      debugMode: this.config.debugMode,
      camera: arg.camera,
      meshs: arg.meshs,
    });

    this.passes[index] = pass;

    return pass;
  }

  createBuffer(
    size: number,
    data: GPUAllowSharedBufferSource,
    usage: GPUBufferUsageFlags,
  ) {
    if (!this.device) throw new Error("WP.init() must be called first");

    const buffer = this.device.createBuffer({ size, usage });
    const bufferObj: WebGPUBuffer = {
      buffer,
    };

    this.device.queue.writeBuffer(buffer, 0, data);

    return bufferObj;
  }
  createTexture(
    size: GPUExtent3DDict,
    data: BufferSource,
    usage: GPUTextureUsageFlags,
    format?: GPUTextureFormat,
  ) {
    if (!this.device) throw new Error("WP.init() must be called first");

    const resolvedFormat = format ?? "rgba8unorm";
    const texture = this.device.createTexture({
      size: size,
      format: resolvedFormat,
      usage: usage,
    });

    const bytesPerPixel: Record<string, number> = {
      rgba8unorm: 4,
      rgba32float: 16,
    };
    const bpp = bytesPerPixel[resolvedFormat];
    if (!bpp) {
      throw new Error(`Unknown bytes-per-pixel for format: ${resolvedFormat}`);
    }

    this.device.queue.writeTexture(
      { texture },
      data,
      {
        bytesPerRow: size.width * bpp,
        rowsPerImage: size.height,
      },
      { width: size.width, height: size.height },
    );
    const textureObj: WebGPUTexture = {
      texture: texture,
    };

    return textureObj;
  }

  async createTextureFromImage(url: string, usage: GPUTextureUsageFlags) {
    if (!this.device) throw new Error("WP.init() must be called first");
    const imageBitmap = await loadImageBitmap(url);
    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: "rgba8unorm",
      usage: usage | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap, flipY: true },
      { texture },
      {
        width: imageBitmap.width,
        height: imageBitmap.height,
      },
    );
    const textureObj: WebGPUTexture = {
      texture: texture,
    };

    return textureObj;
  }
  createSampler() {
    if (!this.device) throw new Error("WP.init() must be called first");

    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    const samplerObj: WebGPUSampler = {
      sampler,
    };

    return samplerObj;
  }

  prevFrameTime = 0;

  async animate(arg: {
    b: B;
    callBack?: PassCallback<B>;
    substepCallback?: PassCallback<B>;
  }) {
    if (!this.device) {
      return;
    }
    const now = performance.now();
    const frameMs = this.prevFrameTime > 0 ? now - this.prevFrameTime : 16.67;
    const simDt = Math.min(0.02, frameMs / 1000);
    this.prevFrameTime = now;

    await this.run(
      this.passes,
      this.config.subSteps,
      arg.b,
      simDt,
      arg.substepCallback,
    );

    this.fpsFrameCount += 1;
    if (this.config.fps) {
      if (this.lastFpsLogTime == 0) {
        this.lastFpsLogTime = now;
      } else if (now - this.lastFpsLogTime >= 1000) {
        const elapsedSec = (now - this.lastFpsLogTime) / 1000;
        const fps = (this.fpsFrameCount / elapsedSec).toFixed(1);
        if (this.fpsElement) {
          this.fpsElement.textContent = `FPS: ${fps}`;
        }
        if (this.timestampElement && this.latestTimestampLines.length) {
          this.timestampElement.textContent =
            this.latestTimestampLines.join("\n");
        }
        this.fpsFrameCount = 0;
        this.lastFpsLogTime = now;
      }
    }
    this.totalFrame += 1;
    arg.callBack?.({ device: this.device, gpuBuffers: arg.b, dt: simDt });
    requestAnimationFrame(() => {
      this.animate(arg);
    });
  }

  async run(
    passes: Array<Render2DPass | Render3DPass | ComputePass>,
    substep: number,
    buffers: B,
    dt: number,
    substepCallback?: PassCallback<B>,
  ) {
    if (!this.device) {
      throw new Error("Device not initialized");
    }
    let returnDatas = null;

    for (let i = 0; i < substep; i++) {
      const shouldSample =
        this.config.debugMode &&
        this.debugFrameCounter % this.config.debugSampleInterval === 0;
      this.debugFrameCounter += 1;

      const encoder = this.device?.createCommandEncoder();
      if (substepCallback) {
        substepCallback({
          device: this.device,
          gpuBuffers: buffers,
          dt: (dt / substep) * this.config.playSpeed,
          encoder,
        });
      }
      const lines: FormatStyle[] = [];
      const debugLines: string[] = [];

      const stagingBuffers: Array<OutGPUBuffer[]> = [];

      const timestampQuery: TimestampQuery | null =
        shouldSample &&
        this.timeDebugPass > 0 &&
        this.device.features.has("timestamp-query")
          ? createTimestampQuery(this.device, this.timeDebugPass)
          : null;

      if (shouldSample) this.device.pushErrorScope("validation");
      for (const e of passes) {
        const stagingBuffer = e.createPass(
          encoder,
          timestampQuery
            ? {
                querySet: timestampQuery.querySet,
                time: e.time,
              }
            : undefined,
        );
        if (e.encoderCallback) e.encoderCallback(encoder);
        stagingBuffers.push(stagingBuffer);
      }

      if (timestampQuery) resolveTimestampQuery(encoder, timestampQuery);

      this.device.queue.submit([encoder.finish()]);
      if (shouldSample) {
        this.device.popErrorScope().then((e) => {
          if (e) console.error("[GPU Validation Error]", e.message);
        });
      }
      const resultDatas: Record<string, Float32Array | Uint32Array> = {};

      if (timestampQuery) {
        debugLines.push(
          ...(await readTimestampLines(timestampQuery, this.timeDebugLabels)),
        );
      }

      for (const [, buffers] of stagingBuffers.entries()) {
        for (const buffer of buffers) {
          await buffer.staginigBuffer.mapAsync(GPUMapMode.READ);

          lines.push({
            format: `${buffer.label === "" ? "None label" : buffer.label}`,
            styles: [],
          });
          let resultData;
          if (buffer.type == "f32") {
            resultData = new Float32Array(
              buffer.staginigBuffer.getMappedRange(0).slice(0),
            );
            resultDatas[buffer.label] = resultData;
          } else {
            resultData = new Uint32Array(
              buffer.staginigBuffer.getMappedRange(0).slice(0),
            );
            resultDatas[buffer.label] = resultData;
          }
          if (buffer.print) {
            lines.push(buffer.print({ array: resultData }));
          } else {
            lines.push(printDefault({ array: resultData }));
          }

          buffer.staginigBuffer.unmap();
        }
      }
      if (this.config.debugPrint) {
        for (const line of lines) {
          console.log(line.format, ...line.styles);
        }
      }
      if (debugLines.length && this.config.debugPassTimestamp) {
        this.latestTimestampLines = debugLines;
      }
      returnDatas = resultDatas;
    }

    return returnDatas;
  }
}
