// ============================================================
// GPUSetting: WGSL uniform 버퍼에 대응하는 getter/setter 베이스 클래스
// CPUSetting: CPU 전용 런타임 파라미터
// ParamsBuffer<G, C>: 위 두 클래스를 제네릭 멤버로 보유
// 라이브러리는 GPU 필드를 정의하지 않는다 — 프로젝트에서 GPUSetting을 상속해 정의한다.
// ============================================================
// ============================================================
// GPUSetting — 프로젝트에서 상속해 필드를 정의한다
// ArrayBuffer 위에 Float32Array/Uint32Array 뷰를 겹쳐놓고
// getter/setter로 인덱스별 필드에 접근한다.
// 서브클래스는 static BYTE_SIZE로 uniform 바이트 크기를 반드시 선언한다 (16의 배수).
// ============================================================
export class GPUSetting {
    static BYTE_SIZE;
    f32;
    u32;
    constructor(buffer) {
        this.f32 = new Float32Array(buffer);
        this.u32 = new Uint32Array(buffer);
    }
}
// ============================================================
// 예시: FLIP 시뮬레이션에서 사용했던 필드 레이아웃
// ============================================================
// class FlipGPUSetting extends GPUSetting {
//   static BYTE_SIZE = 21 * 4 + 12; // 21 필드 + 패딩 → 96 bytes
//
//   // index 0: cellW (u32)
//   // index 1: cellH (u32)
//   // index 2: particleCount (u32)
//   // index 3: dt (f32)
//   // index 4: atomicScale (f32)
//   // index 5: gravity (f32)
//   // index 6: h (u32)
//   // index 7: rho (f32)
//   // index 8: picRatio (f32)
//   // index 9: rk2Enable (u32)
//   // index 10: debugMode (u32)
//   // index 11: aspectRatio (f32)
//   // index 12: radius (f32)
//   // index 13: _pad (f32)
//   // index 14-15: resolution (vec2f)
//   // index 16: collisionCellCount (u32)
//   // index 17: _pad1 (f32)
//   // index 18-19: collisionCellResolution (vec2u)
//   // index 20: parallelOffset (u32)
//
//   get cellW() { return this.u32[0]; }
//   set cellW(v: number) { this.u32[0] = v; }
//   get cellH() { return this.u32[1]; }
//   set cellH(v: number) { this.u32[1] = v; }
//   ... 등
// }
//
// const params = new ParamsBuffer({ gpu: FlipGPUSetting, cpu: FlipCPUSetting });
// ============================================================
// CPUSetting — GPU에 보내지 않고 CPU 로직에서만 쓰는 파라미터
// subSteps/playSpeed 같은 루프 설정은 WP(config)가 관리한다. 프로젝트 전용 값만 상속해 추가한다.
// ============================================================
export class CPUSetting {
}
export class ParamsBuffer {
    buffer;
    byteSize;
    gpu;
    cpu;
    constructor(options) {
        const GPUClass = options.gpu;
        const CPUClass = (options.cpu ?? CPUSetting);
        const size = GPUClass.BYTE_SIZE;
        if (!Number.isInteger(size) || size <= 0 || size % 16 !== 0) {
            throw new Error(`${GPUClass.name}.BYTE_SIZE must be a positive multiple of 16 (got ${size})`);
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
//# sourceMappingURL=params_buffer.js.map