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

export interface AppTextures {
  // 예시: 체커보드 텍스처 예제에서 사용했던 필드
  // Checker: WebGPUTexture;
}
export interface AppSamplers {
  // 예시: 체커보드 텍스처 예제에서 사용했던 필드
  // Checker: WebGPUSampler;
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
//     { bindigIdx: 0, bufferObj: arg.buffers.SomeBuffer },
//     { bindigIdx: 1, bufferObj: arg.buffers.Params },
//   ]);
//   // 텍스처/샘플러는 각각 group(1)/group(2)에 별도 바인딩되므로 인덱스가 buffer와 독립적임
//   pass.writeTexture([
//     { bindigIdx: 0, textureObj: arg.textures.SomeTexture },
//   ]);
//   pass.writeSampler([
//     { bindigIdx: 0, samplerObj: arg.samplers.SomeSampler },
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
//     { bindigIdx: 0, bufferObj: arg.buffers.Particle, label: "Particle" },
//     { bindigIdx: 1, bufferObj: arg.buffers.Params },
//   ]);
// };

// ============================================================
// 예시: 텍스처 + 샘플러 사용 — 체커보드 텍스처를 화면 전체에 렌더
// (실제로 동작 검증까지 마친 예제. src/shader/checker.wgsl에 셰이더 파일이 남아있으니
//  아래 주석을 풀고 AppTextures/AppSamplers에 Checker 필드를 추가하면 바로 재사용 가능)
//
// group 0: Params(uniform) — 셰이더에서 실제로 읽어야 함. 안 그러면 layout: "auto"가
//   해당 그룹의 파이프라인 레이아웃을 통째로 비워버려서(사용 안 하는 바인딩은 제거됨)
//   bindGroup 생성이 실패하고 draw가 조용히 스킵됨(에러 throw 없이 그냥 안 그려짐).
// group 1: texture, group 2: sampler
// ============================================================
// import checkerShaderCode from "./shader/checker.wgsl?raw";
//
// export const CheckerRender: PassRenderQueue = (arg: PassRenderQueueArg) => {
//   const render_pass = arg.wp.createRenderPass(
//     arg.idx,
//     {
//       fragmentEntryPoint: "fMain",
//       vertexEntryPoint: "vMain",
//       shaderCode: applyVariableShaderCode(checkerShaderCode),
//       instanceCount: 1,
//       vertexCount: 3, // vertex_index만으로 풀스크린 삼각형을 그리는 셰이더
//       canvas: arg.canvas,
//       label: "CheckerRender",
//     },
//     arg.time,
//   );
//   render_pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.buffers.Params, label: "Params" },
//   ]);
//   render_pass.writeTexture([
//     { bindigIdx: 0, textureObj: arg.textures.Checker, label: "Checker" },
//   ]);
//   render_pass.writeSampler([
//     { bindigIdx: 0, samplerObj: arg.samplers.Checker, label: "Checker" },
//   ]);
// };
