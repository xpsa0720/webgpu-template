// ============================================================
// 파티클 유틸리티 — 프로젝트별로 필요한 초기화 함수를 정의
// ============================================================

// ============================================================
// 예시: FLIP 시뮬레이션에서 사용했던 파티클 초기화 함수들
// ============================================================

// // 랜덤 파티클 생성 (pos.xy + vel.xy = 4 floats per particle)
// export function randomParticle(PARTICLE_COUNT: number) {
//   const particle = new Float32Array(PARTICLE_COUNT * 4);
//   for (let i = 0; i < PARTICLE_COUNT; i++) {
//     const idx = i * 4;
//     particle[idx] = Math.random() * CELL_W;       // pos.x
//     particle[idx + 1] = Math.random() * CELL_H;   // pos.y
//     particle[idx + 2] = 0;                          // vel.x
//     particle[idx + 3] = 0;                          // vel.y
//   }
//   return particle;
// }

// // Dam-break 파티클 생성 (좌측 절반, 셀당 sub×sub 배치)
// export function damBreakParticle(
//   PARTICLE_COUNT: number,
//   DAMBREAK_CELL_PARTICLE_COUNT: number,
// ) {
//   const particle = new Float32Array(PARTICLE_COUNT * 4);
//   const sub = Math.sqrt(DAMBREAK_CELL_PARTICLE_COUNT);
//   let pIdx = 0;
//   for (let j = 0; j < DAMBREAK_HEIGHT; j++) {
//     for (let i = 0; i < DAMBREAK_WIDTH; i++) {
//       for (let sy = 0; sy < sub; sy++) {
//         for (let sx = 0; sx < sub; sx++) {
//           const idx = pIdx * 4;
//           particle[idx] = i + 1 + (sx + 0.5) / sub;
//           particle[idx + 1] = j + 1 + (sy + 0.5) / sub;
//           particle[idx + 2] = 0;
//           particle[idx + 3] = 0;
//           pIdx++;
//         }
//       }
//     }
//   }
//   return particle;
// }
