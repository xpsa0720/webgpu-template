import type { WebGPUBuffer, WebGPUSampler, WebGPUTexture } from "../struct/webgpu_buffer";
import type { PassQueue, PassQueueArg, PassRenderQueue, PassRenderQueueArg } from "../struct/pass_queue";
import { DEFAULT_CONFIG } from "../setting";

// ============================================================
// 프로젝트별 버퍼/텍스처/샘플러 타입 정의
// 여기에 프로젝트에서 사용하는 GPU 리소스 타입을 정의한다.
// ============================================================
export interface AppBuffers extends Record<string, WebGPUBuffer> {
  params: WebGPUBuffer;
  // particle: WebGPUBuffer;
  // velocity: WebGPUBuffer;
}

export interface AppTextures extends Record<string, WebGPUTexture> {
  // t: WebGPUTexture;
}

export interface AppSamplers extends Record<string, WebGPUSampler> {
  // s: WebGPUSampler;
}

// ============================================================
// 셰이더 코드 컴파일 변수 치환
// @WORKGROUP_SIZE_X 등을 실제 값으로 교체한다.
// ============================================================
export function applyVariableShaderCode(
  shaderCode: string,
  variable?: Record<string, string>,
) {
  let code = shaderCode;
  code = code.replaceAll(
    "@WORKGROUP_SIZE_X",
    String(DEFAULT_CONFIG.workgroupSizeX),
  );
  code = code.replaceAll(
    "@WORKGROUP_SIZE_Y",
    String(DEFAULT_CONFIG.workgroupSizeY),
  );
  code = code.replaceAll(
    "@WORKGROUP_SIZE_2D_X",
    String(DEFAULT_CONFIG.workgroupSize2dX),
  );
  code = code.replaceAll(
    "@WORKGROUP_SIZE_2D_Y",
    String(DEFAULT_CONFIG.workgroupSize2dY),
  );
  if (variable) {
    for (const [key, value] of Object.entries(variable)) {
      code = code.replaceAll(key, value);
    }
  }
  return code;
}

// ============================================================
// Compute Pass 정의 예시
// ============================================================
// import checkerShader from "../shader/checker.wgsl?raw";
//
// export const computeQueue: PassQueue<AppBuffers, AppTextures, AppSamplers> = (arg) => {
//   const shaderCode = applyVariableShaderCode(checkerShader, arg.compileVariable);
//   const pass = arg.wp.createComputePass(arg.idx, {
//     shaderCode,
//     entryPoint: "main",
//     workgroupSizeX: DEFAULT_CONFIG.workgroupSizeX,
//     computeTargetCountX: arg.computeTargetCountX,
//   }, arg.time);
//
//   pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.buffers.params },
//   ]);
//
//   return pass;
// };

// ============================================================
// Render Pass 정의 예시
// ============================================================
// export const renderQueue: PassRenderQueue<AppBuffers, AppTextures, AppSamplers> = (arg) => {
//   const shaderCode = applyVariableShaderCode(checkerShader, arg.compileVariable);
//   const pass = arg.wp.createRenderPass(arg.idx, {
//     target: arg.target,
//     shaderCode,
//     vertexEntryPoint: "vMain",
//     fragmentEntryPoint: "fMain",
//     vertexCount: 6,
//     instanceCount: arg.instanceCount,
//     loadOp: arg.loadOp,
//   }, arg.time);
//
//   pass.writeBuffer([
//     { bindigIdx: 0, bufferObj: arg.buffers.params },
//   ]);
//   if (arg.textures.t) {
//     pass.writeTexture([
//       { bindigIdx: 0, textureObj: arg.textures.t },
//     ]);
//   }
//   if (arg.samplers.s) {
//     pass.writeSampler([
//       { bindigIdx: 0, samplerObj: arg.samplers.s },
//     ]);
//   }
//
//   return pass;
// };
