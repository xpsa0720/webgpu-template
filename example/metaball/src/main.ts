import { WP, ParamsBuffer, GPUSetting } from "@xpsa0720/webgpu";
import type { WebGPUBuffer } from "@xpsa0720/webgpu";
import sourcesWGSL from "./shader/sources.wgsl?raw";
import fieldWGSL from "./shader/field.wgsl?raw";
import displayWGSL from "./shader/display.wgsl?raw";

// field.wgsl / display.wgsl의 GRID와 같은 값
const GRID = 256;
const SOURCE_COUNT = 16;

// 각 셰이더의 struct Params와 같은 순서/레이아웃
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
  sources: WebGPUBuffer;
  field: WebGPUBuffer;
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
    // params는 callBack에서 매 프레임 GPU로 업로드되므로 resize에서는 CPU 값만 갱신한다
    window.addEventListener("resize", () => this.resize());

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
    const sources = this.wp.createBuffer(
      SOURCE_COUNT * 4 * 4,
      new Float32Array(SOURCE_COUNT * 4),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    const field = this.wp.createBuffer(
      GRID * GRID * 4,
      new Float32Array(GRID * GRID),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    return { params, sources, field };
  }

  setupPasses(buffers: AppBuffers) {
    const sourcesPass = this.wp.createComputePass(0, {
      shaderCode: sourcesWGSL,
      entryPoint: "main",
      computeTargetCountX: SOURCE_COUNT,
      label: "sources",
    });
    sourcesPass.writeBuffer([
      { bindigIdx: 0, bufferObj: buffers.params, label: "params" },
      { bindigIdx: 1, bufferObj: buffers.sources, label: "sources" },
    ]);

    const fieldPass = this.wp.createComputePass(1, {
      shaderCode: fieldWGSL,
      entryPoint: "main",
      computeTargetCountX: GRID,
      computeTargetCountY: GRID,
      label: "field",
    });
    fieldPass.writeBuffer([
      { bindigIdx: 0, bufferObj: buffers.sources, label: "sources" },
      { bindigIdx: 1, bufferObj: buffers.field, label: "field" },
    ]);

    for (const pass of [sourcesPass, fieldPass]) {
      console.log(
        `[${pass.label}] workgroupSize =`,
        [pass.workgroupSizeX, pass.workgroupSizeY, pass.workgroupSizeZ],
        "autoWorkgroupSize =",
        pass.autoWorkgroupSize,
      );
    }

    const renderPass = this.wp.createRenderPass(2, {
      target: this.canvas,
      shaderCode: displayWGSL,
      vertexEntryPoint: "vs",
      fragmentEntryPoint: "fs",
      vertexCount: 3,
      instanceCount: 1,
    });

    renderPass.writeBuffer([
      { bindigIdx: 0, bufferObj: buffers.params, label: "params" },
      { bindigIdx: 1, bufferObj: buffers.field, label: "field" },
    ]);
  }
}

const app = new App();
app.init();
