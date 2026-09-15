// ============================================================
// 테스트 유틸리티 — GPU readback 비교 등에 사용
// ============================================================

// 예시: G2P 단독 검증용 테스트 데이터
// export const G2P_TEST_MODE = false;
// export function createG2PTestBuffer(wp: WP): AppBuffers {
//   const testParticle = new Float32Array([3.5, 3.7, 10.0, -4.0]);
//   const Particle = wp.createBuffer(
//     4 * 4,
//     testParticle,
//     GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
//   );
//   // ...
// }
