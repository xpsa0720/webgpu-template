/// <reference types="@webgpu/types" preserve="true" />
export { WP } from "./core/wp";
export { ComputePass } from "./pass/compute_pass";
export { Render2DPass as RenderPass } from "./pass/render_2d_pass";
export { Pass } from "./pass/pass";
export { ParamsBuffer, GPUSetting, CPUSetting } from "./resource/params_buffer";
export type { GPUSettingClass, ParamsBufferOptions } from "./resource/params_buffer";
export { Position } from "./input/position";
export { loadImageBitmap } from "./util/load_image_bitmap";
export { vertexLayoutFromWGSL, checkVertexLayout } from "./util/vertex_layout";
export type {
  VertexLayout,
  VertexLayoutOptions,
  VertexBufferSpec,
  VertexAttributeInfo,
  VertexLayoutLimits,
} from "./util/vertex_layout";
export { printDefault } from "./debug/print";

// 3D
export { Render3DPass } from "./pass/render_3d_pass";
export { Vector3, Vector4 } from "./3d/math/vector";
export { Mat3x3, Mat4x4 } from "./3d/math/matrix";
export { Mesh } from "./3d/mesh/mesh";
export { Cube } from "./3d/mesh/basic/cube";
export { Sphere } from "./3d/mesh/basic/sphere";
export type { MeshParams } from "./3d/mesh/mesh";
export { Geometry } from "./3d/mesh/geometry/geometry";
export { Vertex } from "./3d/mesh/unit/vertex";
export { Camera } from "./types/camera";
export { createMatrix } from "./util/matrix";
export { normalize } from "./util/math";
export { Light, PointLight, AmbientLight, DirectionalLight } from "./shader/gadget/shader_light";
export { Matrial } from "./3d/mesh/matrial/matrial";
export { Specular } from "./3d/mesh/matrial/specular";
export { InstanceMesh } from "./3d/mesh/instance";
export { Vector2 } from "./3d/math/vector";
export { loadModel, loadOBJ, loadGLTF } from "./3d/loader/index";
export type { LoadResult } from "./3d/loader/index";

// types
export type { WebGPUBuffer, WebGPUTexture, WebGPUSampler } from "./types/resource";
export type { PassQueue, PassQueueArg, PassRenderQueue, PassRenderQueueArg } from "./types/pass_queue";
export type { PassCallback, PassCallbackArg, EncoderCallback } from "./types/callback";
export type { FormatStyle, PrintGPUBuffer, PrintGPUBufferArg, PrintType } from "./types/print";
export type { CreatePassTimeTag, CreateComputePassArg, CreateRenderPassArg } from "./types/pass";

// config
export { DEFAULT_CONFIG } from "./core/config";
export type { WPConfig } from "./core/config";
