import GUI from "lil-gui";
import { GPU_PARAMS_BYTE_SIZE, ParamsBuffer } from "./lib/params_buffer";
import type { PassCallback, PassCallbackArg } from "./lib/struct/run_callback";
import { WP } from "./lib/WP";
import { DT } from "./setting";
import type { AppBuffers } from "./shader_queue";

// ============================================================
// substep마다 호출되는 콜백 — 버퍼 초기화 등에 사용
// ============================================================
const clearBuffer: PassCallback = (arg: PassCallbackArg) => {
  if (!arg.encoder) {
    throw new Error("encoder가 없습니다");
  }
  // 예시: 매 substep마다 초기화할 버퍼가 있으면 여기서 clearBuffer 호출
  // arg.encoder.clearBuffer(arg.gpuBuffers.SomeBuffer.buffer, 0, arg.gpuBuffers.SomeBuffer.buffer.size);

  // 예시: dt를 GPU uniform에 반영
  // arg.device.queue.writeBuffer(arg.gpuBuffers.Params.buffer, 12, new Float32Array([arg.dt]));
};

class App {
  width: number;
  height: number;
  params: ParamsBuffer;
  wp: WP;
  b: AppBuffers | null;

  constructor() {
    this.params = new ParamsBuffer();
    this.width = 0;
    this.height = 0;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.wp = new WP({ canvas: canvas, params: this.params });
    this.b = null;
  }

  resize() {
    if (!this.wp.canvas) {
      throw new Error("canvas가 없습니다");
    }

    this.wp.canvas.width = document.body.clientWidth;
    this.wp.canvas.height = document.body.clientHeight;
    this.width = document.body.clientWidth;
    this.height = document.body.clientHeight;

    this.params.gpu.aspectRatio = this.width / this.height;
    if (this.wp.device && this.b) {
      this.renewSettingGPUBuffer();
    }
  }

  async init() {
    await this.wp.init();

    this.resize();
    this.b = this.createBuffer();
    if (!this.wp.canvas) {
      throw new Error("canvas가 없습니다");
    }
    if (!this.wp.device) {
      throw new Error("device가 없습니다");
    }
    if (!this.b) {
      throw new Error("버퍼가 없습니다");
    }

    this.guiSetting();
    window.addEventListener("resize", this.resize.bind(this));
    this.setQueue();

    await this.wp.run(
      this.wp.computePasses,
      this.params.cpu.subSteps,
      this.b,
      DT,
      clearBuffer,
    );

    await this.wp.animate({ b: this.b, substepCallback: clearBuffer });
  }

  renewSettingGPUBuffer() {
    if (!this.wp.device || !this.b) {
      throw new Error("device 또는 버퍼가 없습니다");
    }
    this.wp.device.queue.writeBuffer(this.b.Params.buffer, 0, this.params.data);
  }

  guiSetting() {
    const gui = new GUI();
    // 예시: GUI 설정
    // const settings = {
    //   gravity: -9.8,
    //   substeps: 2,
    //   reset: () => { /* 리셋 로직 */ },
    // };
    // gui.add(settings, "gravity", -200, 0, 0.1).onChange((v: number) => {
    //   this.params.gpu.someField = v;
    //   this.renewSettingGPUBuffer();
    // });
    // gui.add(settings, "substeps", [1, 2, 4]).onChange((v: number) => {
    //   this.params.cpu.subSteps = v;
    // });
    // gui.add(settings, "reset");
  }

  createBuffer(): AppBuffers {
    // GPU Params uniform 버퍼 생성
    this.params.gpu.aspectRatio = this.width / this.height;
    this.params.gpu.resolutionX = this.width;
    this.params.gpu.resolutionY = this.height;

    const Params = this.wp.createBuffer(
      GPU_PARAMS_BYTE_SIZE,
      this.params.data,
      GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    );

    // ============================================================
    // 예시: FLIP 시뮬레이션에서 사용했던 버퍼 생성
    // ============================================================
    // const PARTICLE_COUNT = 2000;
    // const Particle = this.wp.createBuffer(
    //   PARTICLE_COUNT * 4 * 4,
    //   randomParticle(PARTICLE_COUNT),
    //   GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    // );
    // const U_vel_scale = this.wp.createBuffer(
    //   U_FACE_COUNT * 4,
    //   new Float32Array(U_FACE_COUNT),
    //   GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    // );
    // ...

    return {
      Params,
    };
  }

  setQueue() {
    if (!this.b || !this.wp.canvas) {
      throw new Error("버퍼 또는 canvas가 없습니다");
    }

    this.wp.computePasses = [];
    this.wp.renderPasses = [];

    // ============================================================
    // 예시: Compute/Render Pass 등록
    // ============================================================
    // const computeQueue = [];
    // computeQueue.push(
    //   SomeComputePass({
    //     idx: computeQueue.length,
    //     wp: this.wp,
    //     b: this.b,
    //     computeTargetCount: PARTICLE_COUNT,
    //     time: { label: "SomePass", startIndex: 0, endIndex: 1 },
    //   }),
    // );
    //
    // const renderQueue = [];
    // renderQueue.push(
    //   Render({
    //     idx: renderQueue.length,
    //     wp: this.wp,
    //     b: this.b,
    //     canvas: this.wp.canvas,
    //     computeTargetCount: PARTICLE_COUNT,
    //     time: { label: "Render", startIndex: 2, endIndex: 3 },
    //   }),
    // );
  }
}

window.addEventListener("load", async () => {
  const app = new App();
  await app.init();
});
