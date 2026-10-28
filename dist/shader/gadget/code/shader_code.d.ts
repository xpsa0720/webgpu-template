/**
 * group(3) binding 할당 범위
 *
 * 0~9    : 기본 (matrix, camera, material 등)
 * 10~19  : Light (pointLight, ambientLight, directionalLight)
 * 20~29  : Shadow (sampler, shadow textures, light PV matrices)
 * 30~    : 인스턴싱
 */
export declare const SHADER_MESH_MATRIX_STRUCT = "\nstruct Matrixs{\n  normalMatrix: mat4x4<f32>,\n  modelMatrix: mat4x4<f32>\n}";
export declare const SHADER_VERTEXOUT_STRUCT = "\nstruct VertexOut{\n  @builtin(position) position:vec4f,\n  @location(0) normal:vec4f,\n  @location(1) color:vec4f,\n  @location(2) world_position:vec4f,\n  @location(3) @interpolate(flat) instance_index:u32,\n  @location(4) uv:vec2f,\n}";
export declare const SHADER_MATRIAL_STRUCT = "\nstruct Matrial {\n  baseColor: vec4f,\n  specualrColor: vec4f,\n  specualrStrength: f32,\n  specualrShininess: f32,\n  texturFlag: u32,\n  receiveShadow: u32,\n  shadowKernelLength: f32,\n}";
export declare const SHADER_MATRIX_UNIFORM = "@group(3) @binding(0) var<uniform> matrix:Matrixs;";
export declare const SHADER_CAMERA_POSITION_UNIFORM = "@group(3) @binding(1) var<uniform> cameraPos:vec4f;";
export declare const SHADER_LIGHT_COUNTS_UNIFORM = "@group(3) @binding(13) var<uniform> lightCounts: vec4<u32>;";
export declare const SHADER_MATRIAL_UNIFORM = "@group(3) @binding(2) var<uniform> matrial: Matrial;";
export declare const SHADER_MESH_VP_UNIFORM = "@group(3) @binding(3) var<uniform> vpMatrix: mat4x4<f32>;";
export declare const SHADER_MATRIAL_TEXTURE = "@group(3) @binding(4) var tex: texture_2d<f32>;";
export declare const SHADER_MATRIAL_SAMPLER = "@group(3) @binding(5) var texSampler: sampler;";
export declare const SHADER_SHADOW_SAMPLER = "@group(3) @binding(20) var shadowSampler: sampler_comparison;";
export declare const SHADER_DIRECTIONAL_SHADOW_TEXTURE = "@group(3) @binding(21) var directionalShadowTexture: texture_depth_2d_array;";
export declare const SHADER_DIRECTIONAL_LIGHT_PV_MATRIX = "@group(3) @binding(22) var<storage, read> directionalLightPVMatrix: array<mat4x4f>;";
export declare const SHADER_POINT_SHADOW_TEXTURE = "@group(3) @binding(23) var pointShadowTexture: texture_depth_2d_array;";
export declare const SHADER_POINT_LIGHT_PV_MATRIX = "@group(3) @binding(24) var<storage, read> pointLightPVMatrix: array<mat4x4f>;";
export declare const SHADER_VERTEX_INPUT = "@location(0) pos: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f";
export declare const SHADER_VERTEX_DEFAULT = "\n  @vertex\n  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {\n  var out:VertexOut;\n  var mvp = vpMatrix * matrix.modelMatrix;\n  var normalizeNormal = matrix.normalMatrix;\n  var color = matrial.baseColor;\n  var world_position = matrix.modelMatrix;\n\n  out.position = mvp * vec4f(pos,1);\n  out.normal = normalize(normalizeNormal * vec4f(normal,0));;\n  out.color = color;\n  out.world_position = world_position * vec4f(pos,1);\n  out.instance_index = instance_index;\n  out.uv = uv;\n\n  return out;\n}";
export declare const SHADER_FRAGMENT_DEFAULT = "\n@LIGHT_STRUCTS_UNIFORMS\n\n@SHADOW_DEFINES\n\n@LIGHT_FUNCTIONS\n\nfn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f, specualrShininess:f32, specualrStrength:f32, specualrColor:vec3f) -> vec4f{\n  var specualr = pow(max(dot(r.xyz,v.xyz), 0), specualrShininess) * specualrStrength;\n  var color = lightColor.xyz;\n  var result = color*specualr * specualrColor;\n  return vec4f(result,1);\n}\n\n\n\n@fragment\nfn fs(out: VertexOut) -> @location(0) vec4f {\n  var baseColor = out.color;\n  if(matrial.texturFlag == 1){\n    var texColor = textureSample(tex, texSampler, out.uv);\n    baseColor *= texColor;\n  }\n\n  var x = cameraPos.x;\n  var finalColor = vec4f(0,0,0,0);\n  var normal = normalize(out.normal);\n\n  var specualrShininess= matrial.specualrShininess;\n  var specualrStrength= matrial.specualrStrength;\n  var specualrColor= matrial.specualrColor.xyz;\n  var shadowKernelLength = matrial.shadowKernelLength;\n\n  @LIGHT_CODES\n\n  finalColor.a = baseColor.a;\n  return finalColor;\n}";
export interface ShaderLightGadgetTemplate {
    struct: string;
    define: string;
    countPlaceholder: string;
    code: string;
    func: string;
}
export interface ShaderShadowTemplate {
    shadowAddCode: string;
    shadowAddFunc: string;
    instanceShadowAddCode: string;
    instanceShadowAddFunc: string;
}
export declare const POINT_LIGHT: ShaderLightGadgetTemplate & ShaderShadowTemplate;
export declare const AMBIENT_LIGHT: ShaderLightGadgetTemplate;
export declare const DIRECTIONAL_LIGHT: ShaderLightGadgetTemplate & ShaderShadowTemplate;
//# sourceMappingURL=shader_code.d.ts.map