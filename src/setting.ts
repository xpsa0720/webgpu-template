// ============================================================
// 범용 설정 — 프로젝트에 맞게 수정
// ============================================================

export const DEBUG_MODE = false;
export const DEBUG_PRINT = false;
export const DEBUG_PASSTIMESTAMP = false;
export const FPS = true;
export const DT = 1 / 60;
export const WORKGROUP_SIZE = 128;

// ============================================================
// 예시: FLIP 시뮬레이션에서 사용했던 상수들
// 필요한 프로젝트에서 아래처럼 도메인별 상수를 추가한다.
// ============================================================
// export const RADIUS = 1;
// export const ATOMIC_SCALE = 2 ** 14;
// export const PLAY_SPEED = 1;
// export const CELL_W = 100;
// export const CELL_H = 100;
// export const U_FACE_COUNT = (CELL_W + 1) * CELL_H;
// export const V_FACE_COUNT = CELL_W * (CELL_H + 1);
// export const CELL_COUNT = CELL_W * CELL_H;
// export const RHO = 1;
// export const DAMBREAK_MODE = false;
// export const DAMBREAK_CELL_PARTICLE_COUNT = 2;
// export const PARTICLE_COUNT = 2000;
// export const DAMBREAK_WIDTH = Math.round(CELL_W / 2);
// export const DAMBREAK_HEIGHT = CELL_H - 1;
// export const PARTICLE_X_MAX_VEL = 0;
// export const PARTICLE_Y_MAX_VEL = 0;
// export let JACOBI_REPAET = 80;
// export let SUB_STEPS = 2;
// export let GRAVITY = -9.8;
// export let H = 1;
// export let PIC_RATIO = 0.2;
// export let RK2_ENABLE = 1;

// ============================================================
// 예시: 디버그용 스타일 상수
// ============================================================
// export const CELL_TYPE_STYLE: Record<number, string> = {
//   0: "color:#9aa0a6", // AIR
//   1: "color:#4dabf7;", // FLUID
//   2: "color:#ff6b6b;", // SOLID
// };
// export const CELL_TYPE_LABEL: Record<number, string> = {
//   0: "A", 1: "F", 2: "S",
// };
