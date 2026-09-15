// ============================================================
// GPUSetting: WGSL uniform 버퍼에 대응하는 getter/setter 클래스
// CPUSetting: CPU 전용 런타임 파라미터
// ParamsBuffer: 위 두 클래스를 멤버로 보유
// ============================================================

// ============================================================
// GPUSetting — 프로젝트에 맞게 필드를 추가/제거한다
// ArrayBuffer 위에 Float32Array/Uint32Array 뷰를 겹쳐놓고
// getter/setter로 인덱스별 필드에 접근한다.
// ============================================================
export class GPUSetting {
  private f32: Float32Array;
  private u32: Uint32Array;

  constructor(buffer: ArrayBuffer) {
    this.f32 = new Float32Array(buffer);
    this.u32 = new Uint32Array(buffer);
  }

  // --- 프로젝트별 필드를 여기에 정의 ---

  // 예시: aspectRatio (index 0, f32)
  get aspectRatio() { return this.f32[0]; }
  set aspectRatio(v: number) { this.f32[0] = v; }

  // 예시: resolution (index 1-2, f32)
  get resolutionX() { return this.f32[1]; }
  set resolutionX(v: number) { this.f32[1] = v; }
  get resolutionY() { return this.f32[2]; }
  set resolutionY(v: number) { this.f32[2] = v; }

  // ============================================================
  // 예시: FLIP 시뮬레이션에서 사용했던 필드 레이아웃
  // ============================================================
  // index 0: cellW (u32)
  // index 1: cellH (u32)
  // index 2: particleCount (u32)
  // index 3: dt (f32)
  // index 4: atomicScale (f32)
  // index 5: gravity (f32)
  // index 6: h (u32)
  // index 7: rho (f32)
  // index 8: picRatio (f32)
  // index 9: rk2Enable (u32)
  // index 10: debugMode (u32)
  // index 11: aspectRatio (f32)
  // index 12: radius (f32)
  // index 13: _pad (f32)
  // index 14-15: resolution (vec2f)
  // index 16: collisionCellCount (u32)
  // index 17: _pad1 (f32)
  // index 18-19: collisionCellResolution (vec2u)
  // index 20: parallelOffset (u32)
  //
  // get cellW() { return this.u32[0]; }
  // set cellW(v: number) { this.u32[0] = v; }
  // get cellH() { return this.u32[1]; }
  // set cellH(v: number) { this.u32[1] = v; }
  // ... 등
}

// ============================================================
// CPUSetting — GPU에 보내지 않고 CPU 로직에서만 쓰는 파라미터
// ============================================================
export class CPUSetting {
  subSteps = 1;
  playSpeed = 1;

  // 예시: FLIP에서 사용했던 CPU 전용 설정
  // jacobiRepeat = 80;
  // debugPassTimestamp = false;
  // fps = true;
  // dambreakMode = false;
  // particleCount = 2000;
}

// GPU uniform 바이트 크기 — GPUSetting 필드 수 × 4
// 현재 템플릿은 3개 필드 (aspectRatio, resolutionX, resolutionY)
// vec2 alignment 맞추려면 4의 배수로 패딩
export const GPU_PARAMS_BYTE_SIZE = 4 * 4; // 4 × f32 = 16 bytes (1개 패딩 포함)

export class ParamsBuffer {
  private buffer: ArrayBuffer;
  readonly gpu: GPUSetting;
  readonly cpu: CPUSetting;

  constructor() {
    this.buffer = new ArrayBuffer(GPU_PARAMS_BYTE_SIZE);
    this.gpu = new GPUSetting(this.buffer);
    this.cpu = new CPUSetting();
  }

  /** GPU uniform으로 전송할 ArrayBuffer */
  get data() {
    return this.buffer;
  }
}
