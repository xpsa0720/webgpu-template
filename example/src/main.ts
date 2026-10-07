import { WP, ParamsBuffer, GPUSetting } from "@xpsa0720/webgpu";
import type { WebGPUBuffer } from "@xpsa0720/webgpu";
import gradientWGSL from "./shader/gradient.wgsl?raw";

// gradient.wgsl의 struct Params와 같은 순서/레이아웃
class AppGPUSetting extends GPUSetting {
  static BYTE_SIZE = 4 * 4;

  get aspectRatio() { return this.f32[0]; }
  set aspectRatio(v: number) { this.f32[0] = v; }
  get resolutionX() { return this.f32[1]; }
  set resolutionX(v: number) { this.f32[1] = v; }
  get resolutionY() { return this.f32[2]; }
  set resolutionY(v: number) { this.f32[2] = v; }
  get time() { return this.f32[3]; }
  set time(v: number) { this.f32[3] = v; }
}

interface AppBuffers extends Record<string, WebGPUBuffer> {
  params: WebGPUBuffer;
}

class App {
  canvas: HTMLCanvasElement;
  wp: WP<AppBuffers>;
  params: ParamsBuffer<AppGPUSetting>;
  startTime: number;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.params = new ParamsBuffer({ gpu: AppGPUSetting });
    this.startTime = performance.now();
    this.wp = new WP({ canvas: this.canvas });
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
        this.params.gpu.time = (performance.now() - this.startTime) / 1000;
        device.queue.writeBuffer(gpuBuffers.params.buffer, 0, this.params.data);
      },
    });
  }

  createBuffers(): AppBuffers {
    const params = this.wp.createBuffer(
      this.params.byteSize,
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

  private writeParamsToGPU() {}
}

const app = new App();
app.init();
