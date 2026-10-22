/**
 * group(3) binding 할당 범위
 *
 * 0~9    : 기본 (matrix, camera, material 등)
 * 10~19  : Light (pointLight, ambientLight, directionalLight)
 * 20~29  : 인스턴싱 (예정)
 * 30~    : 예약
 */

export const SHADER_MATRIX_STRUCT = `
struct Matrixs{
  mvpMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>
}`;

export const SHADER_VERTEXOUT_STRUCT = `
struct VertexOut{
  @builtin(position) position:vec4f,
  @location(0) normal:vec4f,
  @location(1) color:vec4f,
  @location(2) world_position:vec4f,
}`;

export const SHADER_MATRIAL_STRUCT = `
struct Matrial {
  baseColor: vec4f,
  specualrColor: vec4f,
  specualrStrength: f32,
  specualrShininess: f32,
}`;



export const SHADER_MATRIX_UNIFORM =`@group(3) @binding(0) var<uniform> matrix:Matrixs;`;
export const SHADER_CAMERA_POSITION_UNIFORM =`@group(3) @binding(1) var<uniform> cameraPos:vec4f;`
export const SHADER_MATRIAL_UNIFORM =`@group(3) @binding(2) var<uniform> matrial: Matrial;`
export const SHADER_INSTANCE_FLAG_UNIFORM =`@group(3) @binding(3) var<uniform> instanceFlage: u32`

export const SHADER_INSTANCE_MATRIX_UNIFORM =`@group(3) @binding(20) var<storage, read> instanceMvpMatrix: array<mat4x4<f32>>;`
export const SHADER_INSTANCE_MATRIAL_UNIFORM =`@group(3) @binding(21) var<storage, read> instanceMatrial: array<Matrial>;`




export const SHADER_VERTEX_INPUT = `@location(0) pos: vec3f, @location(1) normal: vec3f`;
export const SHADER_BUILTIN_INPUT = `@builtin(instance_index) instance_index : u32`;

export const SHADER_VERTEX_DEFAULT = `
  @vertex
  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {
  var out:VertexOut;

  out.position = matrix.mvpMatrix * vec4f(pos,1);
  out.normal = normalize(matrix.normalMatrix * vec4f(normal,0));
  out.color = matrial.baseColor;
  out.world_position = matrix.modelMatrix * vec4f(pos,1);

  return out;
}`;

export const SHADER_FRAGMENT_DEFAULT = `
@LIGHT_STRUCTS_UNIFORMS

@LIGHT_FUNCTIONS

fn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f) -> vec4f{
  var specualr = pow(max(dot(r.xyz,v.xyz), 0), matrial.specualrShininess) * matrial.specualrStrength;
  var color = lightColor.xyz;
  var specualrColor = matrial.specualrColor.xyz;
  var result = color*specualr * specualrColor;
  return vec4f(result,1);
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var finalColor=vec4f();
  var x = cameraPos.x;

  @LIGHT_CODES

  finalColor.a = out.color.a;
  return finalColor;
}`;

export interface ShaderLightGadgetTemplate {
  struct: string;
  define: string;
  countPlaceholder: string;
  code: string;
  func: string;
}

export const POINT_LIGHT: ShaderLightGadgetTemplate = {
  struct: `struct PointLight{
    position: vec4f,
    intensity: f32,
    color: vec4f
  }`,
  define: `@group(3) @binding(10) var<uniform> pointLight:array<PointLight, @POINT_LIGHT_COUNT>;`,
  countPlaceholder: "@POINT_LIGHT_COUNT",
  code: `
    for(var i=0; i< @POINT_LIGHT_COUNT; i++){
      finalColor+= PointLight_(pointLight[i].position, out.world_position, out.normal, out.color,pointLight[i].color, pointLight[i].intensity);
    }
    `,
  func: `
    fn PointLight_(lightPosition:vec4f, p:vec4f, normal: vec4f, baseColor: vec4f, lightColor:vec4f, intensity:f32) -> vec4f{
    let l = normalize(lightPosition - p);
    let v = normalize(cameraPos - p);
    let r = 2*dot(normal, l)*normal - l;
    let dist = length(lightPosition.xyz - p.xyz);
    let attenuation = intensity / (dist * dist);
  
    let diffuse = max(dot(normal, l), 0);
    let diffuseColor = baseColor * diffuse * lightColor;
    let specularColor = Speculer(l,r,v,normal, lightColor);
    return (specularColor + diffuseColor) * attenuation;
  }`,
};

export const AMBIENT_LIGHT: ShaderLightGadgetTemplate = {
  struct: `struct AmbientLight{
  intensity: f32,
  color: vec4f
}`,
  define: `@group(3) @binding(11) var<uniform> ambientLight:array<AmbientLight, @AMBIENT_LIGHT_COUNT>;`,
  countPlaceholder: "@AMBIENT_LIGHT_COUNT",
  code: `
    for(var i=0; i< @AMBIENT_LIGHT_COUNT; i++){
      finalColor+= AmbientLight_(out.color, ambientLight[i].intensity);
    }`,
  func: `
    fn AmbientLight_(baseColor: vec4f, ambient:f32) -> vec4f{
      return baseColor * ambient;
    }
  `,
};

export const DIRECTIONAL_LIGHT: ShaderLightGadgetTemplate = {
  struct: `struct DirectionalLight{
    directional: vec4f,
    intensity: f32,
    color: vec4f
  }`,
  define: `@group(3) @binding(12) var<uniform> directionalLight:array<DirectionalLight, @DIRECTIONAL_LIGHT_COUNT>;`,
  countPlaceholder: "@DIRECTIONAL_LIGHT_COUNT",
  code: "",
  func: ``,
};
