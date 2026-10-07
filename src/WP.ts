import { DEFAULT_CONFIG, type WPConfig } from "./setting";
import { loadImageBitmap } from "./util/load_image_bitmap";
import { printDefault } from "./util/print";
import { ComputePass, type OutGPUBuffer } from "./compute_pass";
import type { Pass } from "./pass";
import { RenderPass } from "./render_pass";
import type { FormatStyle } from "./struct/print_gpu_buffer";
import type { PassCallback } from "./struct/run_callback";
import type {
  WebGPUBuffer,
  WebGPUSampler,
  WebGPUTexture,
} from "./struct/webgpu_buffer";

interface WPArg {
  canvas: HTMLCanvasElement;
  config?: WPConfig;
}
interface CreateComputePassArg {
  shaderCode: string;
  entryPoint: string;
  computeTargetCountX: number;
  computeTargetCountY?: number;
  computeTargetCountZ?: number;
  label?: string;
}
export interface CreatePassTimeTag {
  label?: string;
  startIndex?: number;
  endIndex?: number;
}
interface CreateRenderPassArg {
  target: GPUTexture | HTMLCanvasElement;
  shaderCode: string;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  label?: string;
  vertexCount: number;
  instanceCount: number;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
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
  passes: Array<ComputePass | RenderPass>;
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
    this.fpsElement = this.createOverlayElement("fps", "top:0;left:0");
    this.timestampElement = this.createOverlayElement("timestamps", "top:20px;left:0");
    this.latestTimestampLines = [];
    this.debugFrameCounter = 0;
    this.passes = [];
    this.timeDebugLabels = [];
    this.timeDebugPass = 0;
  }

  private createOverlayElement(id: string, position: string): HTMLElement {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const el = document.createElement("pre");
    el.id = id;
    el.style.cssText =
      `position:fixed;${position};margin:0;padding:4px 8px;` +
      "font:12px monospace;color:#0f0;background:rgba(0,0,0,0.5);" +
      "pointer-events:none;z-index:9999;white-space:pre";
    document.body.appendChild(el);
    return el;
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
    const pass = new RenderPass({
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
    passes: Array<RenderPass | ComputePass>,
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
        this.config.debugMode && this.debugFrameCounter % this.config.debugSampleInterval === 0;
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

      let querySet: GPUQuerySet | null = null;
      let resolveBuffer: GPUBuffer | null = null;
      let resolveStagingBuffer: GPUBuffer | null = null;

      if (
        shouldSample &&
        this.timeDebugPass > 0 &&
        this.device.features.has("timestamp-query")
      ) {
        const PASS_COUNT = this.timeDebugPass;
        querySet = this.device.createQuerySet({
          type: "timestamp",
          count: PASS_COUNT,
        });
        resolveBuffer = this.device.createBuffer({
          size: PASS_COUNT * 8,
          usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.QUERY_RESOLVE,
        });
        resolveStagingBuffer = this.device.createBuffer({
          size: PASS_COUNT * 8,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
      }

      if (shouldSample) this.device.pushErrorScope("validation");
      for (const e of passes) {
        const stagingBuffer = e.createPass(
          encoder,
          querySet
            ? {
                querySet: querySet,
                time: e.time,
              }
            : undefined,
        );
        if (e.encoderCallback) e.encoderCallback(encoder);
        stagingBuffers.push(stagingBuffer);
      }

      if (
        shouldSample &&
        querySet &&
        resolveBuffer &&
        resolveStagingBuffer &&
        this.timeDebugPass > 0
      ) {
        encoder.resolveQuerySet(
          querySet,
          0,
          this.timeDebugPass,
          resolveBuffer,
          0,
        );
        encoder.copyBufferToBuffer(
          resolveBuffer,
          0,
          resolveStagingBuffer,
          0,
          resolveBuffer.size,
        );
      }

      this.device.queue.submit([encoder.finish()]);
      if (shouldSample) {
        this.device.popErrorScope().then((e) => {
          if (e) console.error("[GPU Validation Error]", e.message);
        });
      }
      const resultDatas: Record<string, Float32Array | Uint32Array> = {};

      if (shouldSample && resolveStagingBuffer) {
        await resolveStagingBuffer?.mapAsync(GPUMapMode.READ);
        const times = new BigUint64Array(
          resolveStagingBuffer?.getMappedRange(),
        );
        for (let i = 0; i < this.timeDebugLabels.length; i += 1) {
          const begin = times[i * 2];
          const end = times[i * 2 + 1];
          const label = this.timeDebugLabels[i];
          const line = `${label ?? `debug${i / 2}`}: ${(Number(end - begin) / 1_000_000).toFixed(3)}ms`;
          debugLines.push(line);
        }

        resolveStagingBuffer?.unmap();
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
