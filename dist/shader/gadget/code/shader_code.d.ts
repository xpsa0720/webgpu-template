/**
 * group(3) binding 할당 범위
 *
 * 0~9    : 기본 (matrix, camera, material 등)
 * 10~19  : Light (pointLight, ambientLight, directionalLight)
 * 20~29  : 인스턴싱 (예정)
 * 30~    : 예약
 */
export declare const SHADER_MATRIX_STRUCT = "\nstruct Matrixs{\n  mvpMatrix: mat4x4<f32>,\n  normalMatrix: mat4x4<f32>,\n  modelMatrix: mat4x4<f32>\n}";
export declare const SHADER_VERTEXOUT_STRUCT = "\nstruct VertexOut{\n  @builtin(position) position:vec4f,\n  @location(0) normal:vec4f,\n  @location(1) color:vec4f,\n  @location(2) world_position:vec4f,\n  @location(3) @interpolate(flat) instance_index:u32,\n}";
export declare const SHADER_MATRIAL_STRUCT = "\nstruct Matrial {\n  baseColor: vec4f,\n  specualrColor: vec4f,\n  specualrStrength: f32,\n  specualrShininess: f32,\n}";
export declare const SHADER_MATRIX_UNIFORM = "@group(3) @binding(0) var<uniform> matrix:Matrixs;";
export declare const SHADER_CAMERA_POSITION_UNIFORM = "@group(3) @binding(1) var<uniform> cameraPos:vec4f;";
export declare const SHADER_MATRIAL_UNIFORM = "@group(3) @binding(2) var<uniform> matrial: Matrial;";
export declare const SHADER_INSTANCE_FLAG_UNIFORM = "@group(3) @binding(3) var<uniform> instanceFlag: u32";
export declare const SHADER_VERTEX_INPUT = "@location(0) pos: vec3f, @location(1) normal: vec3f";
export declare const SHADER_VERTEX_DEFAULT = "\n  @vertex\n  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {\n  var out:VertexOut;\n  var mvp = matrix.mvpMatrix;\n  var normalizeNormal = matrix.normalMatrix;\n  var color = matrial.baseColor;\n  var world_position = matrix.modelMatrix;\n\n  out.position = mvp * vec4f(pos,1);\n  out.normal = normalize(normalizeNormal * vec4f(normal,0));;\n  out.color = color;\n  out.world_position = world_position * vec4f(pos,1);\n  out.instance_index = instance_index;\n\n  return out;\n}";
export declare const SHADER_FRAGMENT_DEFAULT = "\n@LIGHT_STRUCTS_UNIFORMS\n\n@LIGHT_FUNCTIONS\n\nfn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f, specualrShininess:f32, specualrStrength:f32, specualrColor:vec3f) -> vec4f{\n  var specualr = pow(max(dot(r.xyz,v.xyz), 0), specualrShininess) * specualrStrength;\n  var color = lightColor.xyz;\n  var result = color*specualr * specualrColor;\n  return vec4f(result,1);\n}\n\n@fragment\nfn fs(out: VertexOut) -> @location(0) vec4f {\n  var finalColor=vec4f();\n  var x = cameraPos.x;\n\n  var specualrShininess= matrial.specualrShininess;\n  var specualrStrength= matrial.specualrStrength;\n  var specualrColor= matrial.specualrColor.xyz;\n\n\n  @LIGHT_CODES\n\n  finalColor.a = out.color.a;\n  return finalColor;\n}";
export interface ShaderLightGadgetTemplate {
    struct: string;
    define: string;
    countPlaceholder: string;
    code: string;
    func: string;
}
export declare const POINT_LIGHT: ShaderLightGadgetTemplate;
export declare const AMBIENT_LIGHT: ShaderLightGadgetTemplate;
export declare const DIRECTIONAL_LIGHT: ShaderLightGadgetTemplate;
//# sourceMappingURL=shader_code.d.ts.map