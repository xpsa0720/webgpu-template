// ============================================================
// shader_queue.ts — Pass 정의와 버퍼 인터페이스
// ============================================================

import type {
  PassQueue,
  PassQueueArg,
  PassRenderQueue,
  PassRenderQueueArg,
} from "./lib/struct/pass_queue";
import type {
  WebGPUBuffer,
  WebGPUSampler,
  WebGPUTexture,
} from "./lib/struct/webgpu_buffer";
import { WORKGROUP_SIZE_X, WORKGROUP_SIZE_Y } from "./setting";

// ============================================================
// 프로젝트별 GPU 버퍼/텍스처/샘플러 인터페이스 — 필요한 리소스를 여기에 정의
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
  // 예시: 체커보드 텍스처
  // Checker: WebGPUTexture;
}

export interface AppSamplers {
  // 예시: 체커보드 샘플러
  // Checker: WebGPUSampler;
}

// ============================================================
// 셰이더 코드 전처리 — @WORKGROUP_SIZE_X / @WORKGROUP_SIZE_Y 등 컴파일 변수 치환
// ============================================================
const applyVariableShaderCode = (
  code: string,
  record: Record<string, string> = {},
  workgroupSizeX: number = WORKGROUP_SIZE_X,
  workgroupSizeY: number = WORKGROUP_SIZE_Y,
) => {
  let result = code
    .replaceAll("@WORKGROUP_SIZE_X", String(workgroupSizeX))
    .replaceAll("@WORKGROUP_SIZE_Y", String(workgroupSizeY));
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
//       workgroupSizeX: WORKGROUP_SIZE_X,
//       computeTargetCountX: arg.computeTargetCountX,
//       computeTargetCountY: arg.computeTargetCountY,
//       label: "SomeCompute",
//     },
//     arg.time,
//   );
//   pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.buffers.SomeBuffer },
//     { bindigIdx: 1, bufferObj: arg.buffers.Params },
//   ]);
//   // 텍스처/샘플러는 각각 group(1)/group(2)에 별도 바인딩
//   // pass.writeTexture([{ bindigIdx: 0, textureObj: arg.textures.SomeTexture }]);
//   // pass.writeSampler([{ bindigIdx: 0, samplerObj: arg.samplers.someSampler }]);
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
//       instanceCount: arg.instanceCount,
//       vertexCount: 6,
//       target: arg.target,
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
