import {
  DEBUG_MODE,
  DEBUG_PASSTIMESTAMP,
  DEBUG_PRINT,
  DEBUG_SAMPLE_INTERVAL,
  FPS,
} from "../setting";
import type { AppBuffers } from "../shader_queue";
import { loadImageBitmap } from "../utill/load_image_bitmap";
import { loadImageBitmap } from "../utill/load_image_bitmap";
import { printDefault } from "../utill/print";
import { ComputePass, type OutGPUBuffer } from "./compute_pass";
import type { ParamsBuffer } from "./params_buffer";
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
  params: ParamsBuffer;
}
interface CreateComputePassArg {
  shaderCode: string;
  entryPoint: string;
  workgroupSizeX: number;
  workgroupSizeY?: number;
  computeTargetCountX: number;
  computeTargetCountY?: number;
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
  foramt?: GPUTextureFormat;
}

export class WP {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  passes: Array<ComputePass | RenderPass>;
  params: ParamsBuffer;
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
    this.params = arg.params;
    const ctx = this.canvas?.getContext("webgpu");
    if (!ctx) {
      throw new Error("webgpu 가져오지 못함");
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
      throw Error("WebGPU를 지원하는 브라우저가 아닙니다");
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
      throw new Error("init을 하시오");
    }
    if (
      time?.startIndex &&
      time?.endIndex &&
      time?.startIndex == time?.endIndex
    ) {
      throw new Error("인덱스가 겹칠 수 없습니다!");
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
      entryPoint: arg.entryPoint,
      shaderCode: arg.shaderCode,
      workgroupSize: arg.workgroupSizeX,
      label: arg.label,
      time: time,
      encoderCallback,
      preEncoderCallback,
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
    encoderCallback?: (encoder: GPUCommandEncoder) => void,
  ) {
    if (!this.device) {
      throw new Error("init을 하시오");
    }
    if (
      time?.startIndex &&
      time?.endIndex &&
      time?.startIndex == time?.endIndex
    ) {
      throw new Error("인덱스가 겹칠 수 없습니다!");
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
      target: arg.target,
      format: arg.foramt,
    });

    this.passes[index] = pass;

    return pass;
  }

  createBuffer(
    size: number,
    data: GPUAllowSharedBufferSource,
    usage: GPUBufferUsageFlags,
  ) {
    if (!this.device) throw new Error("init WP 누락");

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
    if (!this.device) throw new Error("init WP 누락");

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
      throw new Error(`bytesPerPixel을 모르는 포맷입니다: ${resolvedFormat}`);
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
    if (!this.device) throw new Error("init WP 누락");
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
    if (!this.device) throw new Error("init WP 누락");

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
    b: AppBuffers;
    callBack?: PassCallback;
    substepCallback?: PassCallback;
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
      this.params.cpu.subSteps,
      arg.b,
      simDt,
      arg.substepCallback,
    );

    this.fpsFrameCount += 1;
    if (FPS) {
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
    buffers: AppBuffers,
    dt: number,
    substepCallback?: PassCallback,
  ) {
    if (!this.device) {
      throw new Error("device가 없습니다");
    }
    let returnDatas = null;

    for (let i = 0; i < substep; i++) {
      // 매 프레임 타임스탬프 리드백을 하면 CPU-GPU 파이프라이닝이 깨져서
      // 측정 자체가 프레임을 느리게 만든다 — N프레임에 한 번만 샘플링한다
      const shouldSample =
        DEBUG_MODE && this.debugFrameCounter % DEBUG_SAMPLE_INTERVAL === 0;
      this.debugFrameCounter += 1;

      const encoder = this.device?.createCommandEncoder();
      if (substepCallback) {
        substepCallback({
          device: this.device,
          gpuBuffers: buffers,
          dt: (dt / substep) * this.params.cpu.playSpeed,
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
      if (DEBUG_PRINT) {
        for (const line of lines) {
          console.log(line.format, ...line.styles);
        }
      }
      if (debugLines.length && DEBUG_PASSTIMESTAMP) {
        this.latestTimestampLines = debugLines;
      }
      returnDatas = resultDatas;
    }

    return returnDatas;
  }
}
