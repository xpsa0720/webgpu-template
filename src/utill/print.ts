import type {
  FormatStyle,
  PrintGPUBuffer,
  PrintGPUBufferArg,
} from "../lib/struct/print_gpu_buffer";

// ============================================================
// 기본 출력 — 배열을 공백으로 구분해서 출력
// ============================================================
export const printDefault: PrintGPUBuffer = (arg: PrintGPUBufferArg) => {
  let format = "";

  arg.array.forEach((e, i) => {
    const t = arg.array[i];
    format += `${t} `;
  });

  return { format, styles: [] };
};

// ============================================================
// 예시: FLIP 시뮬레이션에서 사용했던 디버그 출력 함수들
// ============================================================

// // 셀 타입 그리드 출력 (AIR/FLUID/SOLID)
// export const printCellType: PrintGPUBuffer = (arg: PrintGPUBufferArg) => {
//   let format = "";
//   const styles: string[] = [];
//   for (let j = CELL_H - 1; j >= 0; j--) {
//     for (let i = 0; i < CELL_W; i++) {
//       const t = arg.array[i + j * CELL_W];
//       format += `%c${CELL_TYPE_LABEL[t] ?? "?"} `;
//       styles.push(CELL_TYPE_STYLE[t] ?? "color:inherit");
//     }
//     format += "\n";
//   }
//   return { format, styles };
// };

// // U velocity 그리드 출력
// export const printUvelocity: PrintGPUBuffer = (arg: PrintGPUBufferArg) => {
//   let format = "";
//   const styles: string[] = [];
//   for (let j = CELL_H - 1; j >= 0; j--) {
//     for (let i = 0; i < CELL_W + 1; i++) {
//       const t = arg.array[i + j * (CELL_W + 1)];
//       const value = t == 0 ? 0 : 1;
//       format += `%c${String(t.toFixed(0)).padStart(2, "0")} `;
//       styles.push(VELOCITY_TYPE_STYLE[value] ?? "color:inherit");
//     }
//     format += "\n";
//   }
//   return { format, styles };
// };

// // V velocity 그리드 출력
// export const printVvelocity: PrintGPUBuffer = (arg: PrintGPUBufferArg) => { ... };

// // Divergence 그리드 출력
// export const printDivergence: PrintGPUBuffer = (arg: PrintGPUBufferArg) => { ... };

// // 바닥에 닿은 파티클 수 카운트
// export const printParticleFloorCount: PrintGPUBuffer = (arg: PrintGPUBufferArg) => { ... };
