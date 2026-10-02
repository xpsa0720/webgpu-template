import {
  WP,
  ParamsBuffer,
  GPU_PARAMS_BYTE_SIZE,
} from "@xpsa0720/webgpu";
import type { WebGPUBuffer } from "@xpsa0720/webgpu";
import gradientWGSL from "./shader/gradient.wgsl?raw";

interface AppBuffers extends Record<string, WebGPUBuffer> {
  params: WebGPUBuffer;
}

class App {
  canvas: HTMLCanvasElement;
  wp: WP<AppBuffers>;
  params: ParamsBuffer;
  startTime: number;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.params = new ParamsBuffer();
    this.startTime = performance.now();
    this.wp = new WP({
      canvas: this.canvas,
      params: this.params,
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.params.gpu.aspectRatio = this.canvas.width / this.canvas.height;
    this.params.gpu.resolutionX = this.canvas.width;
    this.params.gpu.resolutionY = this.canvas.height;
  }

  async init() {
    await this.wp.init();
    this.resize();
    window.addEventListener("resize", () => {
      this.resize();
      this.writeParamsToGPU();
    });

    const buffers = this.createBuffers();
    this.setupPasses(buffers);

    this.wp.animate({
      b: buffers,
      callBack: ({ device, gpuBuffers }) => {
        // 매 프레임 time 갱신
        const elapsed = (performance.now() - this.startTime) / 1000;
        // GPUSetting의 index 3 (패딩 자리)을 time으로 사용
        const f32 = new Float32Array(this.params.data);
        f32[3] = elapsed;
        device.queue.writeBuffer(
          gpuBuffers.params.buffer,
          0,
          this.params.data,
        );
      },
    });
  }

  createBuffers(): AppBuffers {
    const params = this.wp.createBuffer(
      GPU_PARAMS_BYTE_SIZE,
      this.params.data,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    return { params };
  }

  setupPasses(buffers: AppBuffers) {
    const renderPass = this.wp.createRenderPass(0, {
      target: this.canvas,
      shaderCode: gradientWGSL,
      vertexEntryPoint: "vs",
      fragmentEntryPoint: "fs",
      vertexCount: 3,
      instanceCount: 1,
    });

    renderPass.writeBuffer([
      { bindigIdx: 0, bufferObj: buffers.params, label: "params" },
    ]);
  }

  private writeParamsToGPU() {
  }
}

const app = new App();
app.init();
