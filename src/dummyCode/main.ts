import { GPUSetting, ParamsBuffer } from "../params_buffer";
import { Position } from "../position";
import type { WP } from "../WP";
import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "../struct/webgpu_buffer";
import type { PassCallback } from "../struct/run_callback";
import { applyVariableShaderCode, type AppBuffers, type AppTextures, type AppSamplers } from "./shader_queue";

// 프로젝트별 uniform 레이아웃 (WGSL struct와 일치시킬 것)
class AppGPUSetting extends GPUSetting {
  static BYTE_SIZE = 16;

  get aspectRatio() { return this.f32[0]; }
  set aspectRatio(v: number) { this.f32[0] = v; }
  get resolutionX() { return this.f32[1]; }
  set resolutionX(v: number) { this.f32[1] = v; }
  get resolutionY() { return this.f32[2]; }
  set resolutionY(v: number) { this.f32[2] = v; }
}

const clearBuffer: PassCallback<AppBuffers> = (arg) => {
  // substep마다 호출
};

class App {
  canvas: HTMLCanvasElement;
  wp: WP<AppBuffers, AppTextures, AppSamplers>;
  params: ParamsBuffer<AppGPUSetting>;
  position: Position;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.params = new ParamsBuffer({ gpu: AppGPUSetting });
    this.position = new Position();
    this.wp = new (
      // @ts-ignore -- 실제 사용 시 WP를 import
      (await import("../WP")).WP
    )({
      canvas: this.canvas,
      config: { subSteps: 1, playSpeed: 1 },
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
      this.renewSettingGPUBuffer();
    });

    // this.guiSetting();

    const buffers = this.createBuffer();
    const textures = this.createTextures();
    const samplers = this.createSampler();
    this.setQueue(buffers, textures, samplers);
    this.wp.animate({ b: buffers, substepCallback: clearBuffer });
  }

  renewSettingGPUBuffer() {
    // buffers.params가 있다면:
    // this.wp.device!.queue.writeBuffer(
    //   buffers.params.buffer,
    //   0,
    //   this.params.data,
    // );
  }

  // guiSetting() {
  //   const gui = new GUI();
  //   gui.add(this.wp.config, "subSteps", 1, 10, 1).name("Sub Steps");
  // }

  createBuffer(): AppBuffers {
    const params = this.wp.createBuffer(
      this.params.byteSize,
      this.params.data,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );

    return {
      params,
    };
  }

  createTextures(): AppTextures {
    // const tex = await this.wp.createTextureFromImage(
    //   "/path/to/image.png",
    //   GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    // );
    return {
      // t: tex,
    };
  }

  createSampler(): AppSamplers {
    // const sampler = this.wp.createSampler();
    return {
      // s: sampler,
    };
  }

  setQueue(
    buffers: AppBuffers,
    textures: AppTextures,
    samplers: AppSamplers,
  ) {
    let idx = 0;

    // ---- Compute Pass 예시 ----
    // const computePass = computeQueue({
    //   wp: this.wp,
    //   buffers,
    //   textures,
    //   samplers,
    //   idx: idx++,
    //   computeTargetCountX: PARTICLE_COUNT,
    // });

    // ---- Render Pass 예시 ----
    // const renderPass = renderQueue({
    //   wp: this.wp,
    //   buffers,
    //   textures,
    //   samplers,
    //   idx: idx++,
    //   target: this.canvas,
    //   instanceCount: PARTICLE_COUNT,
    //   loadOp: "clear",
    // });
  }
}

const app = new App();
app.init();
