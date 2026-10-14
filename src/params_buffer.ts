export class GPUSetting {
  static BYTE_SIZE: number;

  protected f32: Float32Array;
  protected u32: Uint32Array;

  constructor(buffer: ArrayBuffer) {
    this.f32 = new Float32Array(buffer);
    this.u32 = new Uint32Array(buffer);
  }
}


export class CPUSetting {
  // 예시: FLIP에서 사용했던 CPU 전용 설정 (class FlipCPUSetting extends CPUSetting)
  // jacobiRepeat = 80;
  // debugPassTimestamp = false;
  // fps = true;
  // dambreakMode = false;
  // particleCount = 2000;
}

export interface GPUSettingClass<G extends GPUSetting> {
  new (buffer: ArrayBuffer): G;
  BYTE_SIZE: number;
}

export interface ParamsBufferOptions<G extends GPUSetting, C extends CPUSetting> {
  gpu: GPUSettingClass<G>;
  cpu?: new () => C;
}

export class ParamsBuffer<
  G extends GPUSetting = GPUSetting,
  C extends CPUSetting = CPUSetting,
> {
  private buffer: ArrayBuffer;
  readonly byteSize: number;
  readonly gpu: G;
  readonly cpu: C;

  constructor(options: ParamsBufferOptions<G, C>) {
    const GPUClass = options.gpu;
    const CPUClass = (options.cpu ?? CPUSetting) as new () => C;

    const size = GPUClass.BYTE_SIZE;
    if (!Number.isInteger(size) || size <= 0 || size % 16 !== 0) {
      throw new Error(
        `${GPUClass.name}.BYTE_SIZE must be a positive multiple of 16 (got ${size})`,
      );
    }

    this.byteSize = size;
    this.buffer = new ArrayBuffer(this.byteSize);
    this.gpu = new GPUClass(this.buffer);
    this.cpu = new CPUClass();
  }

  /** GPU uniform으로 전송할 ArrayBuffer */
  get data() {
    return this.buffer;
  }
}
