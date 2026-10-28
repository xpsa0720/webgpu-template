import {
  SHADOW_DIRECTIONAL_ADD_FUNC,
  SHADOW_DIRECTIONAL_COMPARE,
  SHADOW_INSTANCE_DIRECTIONAL_ADD_FUNC,
  SHADOW_INSTANCE_DIRECTIONAL_COMPARE,
  SHADOW_INSTANCE_POINT_ADD_FUNC,
  SHADOW_INSTANCE_POINT_COMPARE,
  SHADOW_POINT_ADD_FUNC,
  SHADOW_POINT_COMPARE,
} from "./shadow_add";

/**
 * group(3) binding 할당 범위
 *
 * 0~9    : 기본 (matrix, camera, material 등)
 * 10~19  : Light (pointLight, ambientLight, directionalLight)
 * 20~29  : Shadow (sampler, shadow textures, light PV matrices)
 * 30~    : 인스턴싱
 */
export const SHADER_MESH_MATRIX_STRUCT = `
struct Matrixs{
  normalMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>
}`;

export const SHADER_VERTEXOUT_STRUCT = `
struct VertexOut{
  @builtin(position) position:vec4f,
  @location(0) normal:vec4f,
  @location(1) color:vec4f,
  @location(2) world_position:vec4f,
  @location(3) @interpolate(flat) instance_index:u32,
  @location(4) uv:vec2f,
}`;

export const SHADER_MATRIAL_STRUCT = `
struct Matrial {
  baseColor: vec4f,
  specualrColor: vec4f,
  specualrStrength: f32,
  specualrShininess: f32,
  texturFlag: u32,
  receiveShadow: u32,
  shadowKernelLength: f32,
}`;

export const SHADER_MATRIX_UNIFORM = `@group(3) @binding(0) var<uniform> matrix:Matrixs;`;
export const SHADER_CAMERA_POSITION_UNIFORM = `@group(3) @binding(1) var<uniform> cameraPos:vec4f;`;
export const SHADER_LIGHT_COUNTS_UNIFORM =`@group(3) @binding(13) var<uniform> lightCounts: vec4<u32>;`;
export const SHADER_MATRIAL_UNIFORM = `@group(3) @binding(2) var<uniform> matrial: Matrial;`;
export const SHADER_MESH_VP_UNIFORM = `@group(3) @binding(3) var<uniform> vpMatrix: mat4x4<f32>;`;
export const SHADER_MATRIAL_TEXTURE = `@group(3) @binding(4) var tex: texture_2d<f32>;`;
export const SHADER_MATRIAL_SAMPLER = `@group(3) @binding(5) var texSampler: sampler;`;


export const SHADER_SHADOW_SAMPLER = `@group(3) @binding(20) var shadowSampler: sampler_comparison;`;
export const SHADER_DIRECTIONAL_SHADOW_TEXTURE = `@group(3) @binding(21) var directionalShadowTexture: texture_depth_2d_array;`;
export const SHADER_DIRECTIONAL_LIGHT_PV_MATRIX = `@group(3) @binding(22) var<storage, read> directionalLightPVMatrix: array<mat4x4f>;`;
export const SHADER_POINT_SHADOW_TEXTURE = `@group(3) @binding(23) var pointShadowTexture: texture_depth_2d_array;`;
export const SHADER_POINT_LIGHT_PV_MATRIX = `@group(3) @binding(24) var<storage, read> pointLightPVMatrix: array<mat4x4f>;`;

export const SHADER_VERTEX_INPUT = `@location(0) pos: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f`;

export const SHADER_VERTEX_DEFAULT = `
  @vertex
  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {
  var out:VertexOut;
  var mvp = vpMatrix * matrix.modelMatrix;
  var normalizeNormal = matrix.normalMatrix;
  var color = matrial.baseColor;
  var world_position = matrix.modelMatrix;

  out.position = mvp * vec4f(pos,1);
  out.normal = normalize(normalizeNormal * vec4f(normal,0));;
  out.color = color;
  out.world_position = world_position * vec4f(pos,1);
  out.instance_index = instance_index;
  out.uv = uv;

  return out;
}`;

export const SHADER_FRAGMENT_DEFAULT = `
@LIGHT_STRUCTS_UNIFORMS

@SHADOW_DEFINES

@LIGHT_FUNCTIONS

fn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f, specualrShininess:f32, specualrStrength:f32, specualrColor:vec3f) -> vec4f{
  var specualr = pow(max(dot(r.xyz,v.xyz), 0), specualrShininess) * specualrStrength;
  var color = lightColor.xyz;
  var result = color*specualr * specualrColor;
  return vec4f(result,1);
}



@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var baseColor = out.color;
  if(matrial.texturFlag == 1){
    var texColor = textureSample(tex, texSampler, out.uv);
    baseColor *= texColor;
  }

  var x = cameraPos.x;
  var finalColor = vec4f(0,0,0,0);
  var normal = normalize(out.normal);

  var specualrShininess= matrial.specualrShininess;
  var specualrStrength= matrial.specualrStrength;
  var specualrColor= matrial.specualrColor.xyz;
  var shadowKernelLength = matrial.shadowKernelLength;

  @LIGHT_CODES

  finalColor.a = baseColor.a;
  return finalColor;
}`;

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

export const POINT_LIGHT: ShaderLightGadgetTemplate & ShaderShadowTemplate = {
  struct: `struct PointLight{
    position: vec4f,
    intensity: f32,
    color: vec4f,
    castShadow: u32,
  }`,
  define: `@group(3) @binding(10) var<uniform> pointLight:array<PointLight, @POINT_LIGHT_COUNT>;`,
  countPlaceholder: "@POINT_LIGHT_COUNT",
  code: `
  var nonePointShadowCount = 0u;
  for(var i = 0u; i < lightCounts.x; i++) {

      @POINT_LIGHT_COMPARE_CODE

      finalColor += PointLight_(
              pointLight[i].position,
              out.world_position,
              normal,
              baseColor,
              pointLight[i].color,
              pointLight[i].intensity,
              specualrShininess,
              specualrStrength,
              specualrColor,
              i - nonePointShadowCount,
              out.world_position,
          );
  }
    `,
  func: `
fn PointLight_(
    lightPosition: vec4f,
    p: vec4f,
    normal: vec4f,
    baseColor: vec4f,
    lightColor: vec4f,
    intensity: f32,
    specualrShininess: f32,
    specualrStrength: f32,
    specualrColor: vec3f,
    lightIndex: u32,
    worldPos: vec4f,
) -> vec4f {
    let l = normalize(lightPosition - p);
    let v = normalize(cameraPos - p);
    let r = 2*dot(normal, l)*normal - l;
    let dist = length(lightPosition.xyz - p.xyz);
    let attenuation = intensity / (dist * dist);

    let diffuse = max(dot(normal, l), 0);
    let diffuseColor = baseColor * diffuse * lightColor;
    let specularColor = Speculer(l,r,v,normal, lightColor,specualrShininess,specualrStrength,specualrColor);

    var visibilty = 1f;

    @POINT_SHADOW_VISIBILTY_FUNC_CODE

    return (specularColor + diffuseColor) * attenuation * visibilty;
}`,
  shadowAddCode: SHADOW_POINT_COMPARE,
  shadowAddFunc: SHADOW_POINT_ADD_FUNC,
  instanceShadowAddCode: SHADOW_INSTANCE_POINT_COMPARE,
  instanceShadowAddFunc: SHADOW_INSTANCE_POINT_ADD_FUNC,
};

export const AMBIENT_LIGHT: ShaderLightGadgetTemplate = {
  struct: `struct AmbientLight{
  intensity: f32,
  color: vec4f
}`,
  define: `@group(3) @binding(11) var<uniform> ambientLight:array<AmbientLight, @AMBIENT_LIGHT_COUNT>;`,
  countPlaceholder: "@AMBIENT_LIGHT_COUNT",
  code: `
    for(var i = 0u; i < lightCounts.y; i++){
      finalColor+= AmbientLight_(baseColor, ambientLight[i].intensity);
    }`,
  func: `
    fn AmbientLight_(baseColor: vec4f, ambient:f32) -> vec4f{
      return baseColor * ambient;
    }
  `,
};

export const DIRECTIONAL_LIGHT: ShaderLightGadgetTemplate & ShaderShadowTemplate = {
  struct: `struct DirectionalLight{
    directional: vec4f,
    intensity: f32,
    color: vec4f,
    castShadow: u32,
  }`,
  define: `@group(3) @binding(12) var<uniform> directionalLight:array<DirectionalLight, @DIRECTIONAL_LIGHT_COUNT>;`,
  countPlaceholder: "@DIRECTIONAL_LIGHT_COUNT",
  code: `
  var noneDirectionalShadowCount = 0u;
  for(var i = 0u; i < lightCounts.z; i++) {
      var castShadow = true;
      var reciveShadow = true;
        
      @DIRECTIONAL_LIGHT_COMPARE_CODE

      finalColor += DirectionalLight_(
              baseColor,
              normal,
              directionalLight[i].intensity,
              directionalLight[i].directional,
              directionalLight[i].color,
              i - noneDirectionalShadowCount,
              out.world_position,
              castShadow,
              reciveShadow,
              shadowKernelLength
          );
  }
  `,
  func: `
fn DirectionalLight_(
    baseColor: vec4f,
    normal: vec4f,
    intensity: f32,
    directional: vec4f,
    lightColor: vec4f,
    lightIndex: u32,
    worldPos: vec4f,
    castShadow:bool,
    reciveShadow:bool,
    shadowKernelLength:f32,
) -> vec4f {
    let l = normalize(-directional);
    let diffuse = max(dot(normal, l), 0);

    var visibilty = 1f;

    @DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE

    return baseColor * diffuse * lightColor * intensity * visibilty;
}

  `,
  shadowAddCode: SHADOW_DIRECTIONAL_COMPARE,
  shadowAddFunc:SHADOW_DIRECTIONAL_ADD_FUNC,
  instanceShadowAddCode: SHADOW_INSTANCE_DIRECTIONAL_COMPARE,
  instanceShadowAddFunc: SHADOW_INSTANCE_DIRECTIONAL_ADD_FUNC,
};
