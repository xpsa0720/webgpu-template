// ============================================================
// shader_queue.ts — Pass 정의와 버퍼 인터페이스
// ============================================================

import type {
  PassQueue,
  PassQueueArg,
  PassRenderQueue,
  PassRenderQueueArg,
} from "./lib/struct/pass_queue";
import type { WebGPUBuffer } from "./lib/struct/webgpu_buffer";
import { WORKGROUP_SIZE } from "./setting";

// ============================================================
// 프로젝트별 GPU 버퍼 인터페이스 — 필요한 버퍼를 여기에 정의
// ============================================================
export interface AppBuffers {
  Params: WebGPUBuffer;
  // 예시: FLIP 시뮬레이션에서 사용했던 버퍼들
  // Particle: WebGPUBuffer;
  // Temp_Particle: WebGPUBuffer;
  // U_vel_scale: WebGPUBuffer;
  // U_W_vel_scale: WebGPUBuffer;
  // V_vel_scale: WebGPUBuffer;
  // V_W_vel_scale: WebGPUBuffer;
  // U_vel_normal: WebGPUBuffer;
  // V_vel_normal: WebGPUBuffer;
  // U_vel_normal_old: WebGPUBuffer;
  // V_vel_normal_old: WebGPUBuffer;
  // CellType: WebGPUBuffer;
  // Divergence: WebGPUBuffer;
  // Pressure_A: WebGPUBuffer;
  // Pressure_B: WebGPUBuffer;
}

// ============================================================
// 셰이더 코드 전처리 — @WORKGROUP_SIZE 등 컴파일 변수 치환
// ============================================================
const applyVariableShaderCode = (
  code: string,
  record: Record<string, string> = {},
) => {
  let result = code.replaceAll("@WORKGROUP_SIZE", String(WORKGROUP_SIZE));
  for (const [variable, value] of Object.entries(record)) {
    result = result.replaceAll(variable, value);
  }
  return result;
};

// ============================================================
// 예시: Compute Pass 정의
// ============================================================
// import someShaderCode from './shader/some.wgsl?raw';
//
// export const SomeComputePass: PassQueue = (arg: PassQueueArg) => {
//   const pass = arg.wp.createComputePass(
//     arg.idx,
//     {
//       entryPoint: "main",
//       shaderCode: applyVariableShaderCode(someShaderCode, arg.compileVariable),
//       workgroupSize: WORKGROUP_SIZE,
//       computeTargetCount: arg.computeTargetCount,
//       label: "SomeCompute",
//     },
//     arg.time,
//   );
//   pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.b.SomeBuffer },
//     { bindigIdx: 1, bufferObj: arg.b.Params },
//   ]);
// };

// ============================================================
// 예시: Render Pass 정의
// ============================================================
// import renderShaderCode from './shader/render.wgsl?raw';
//
// export const Render: PassRenderQueue = (arg: PassRenderQueueArg) => {
//   const render_pass = arg.wp.createRenderPass(
//     arg.idx,
//     {
//       fragmentEntryPoint: "fMain",
//       vertexEntryPoint: "vMain",
//       shaderCode: applyVariableShaderCode(renderShaderCode),
//       instanceCount: arg.computeTargetCount,
//       vertexCount: 6,
//       canvas: arg.canvas,
//       label: "Render",
//       loadOp: arg.loadOp,
//     },
//     arg.time,
//   );
//   render_pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.b.Particle, label: "Particle" },
//     { bindigIdx: 1, bufferObj: arg.b.Params },
//   ]);
// };
