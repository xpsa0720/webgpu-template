export const SHADER_INSTANCE_MATRIX_STRUCT = `
struct InstanceMatrix{
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>
}`;
export const SHADER_INSTANCE_VP_UNIFORM = `@group(3) @binding(0) var<uniform> vpMatrix: mat4x4<f32>;`;
export const SHADER_INSTANCE_MATRIX_STORAGE = `@group(3) @binding(20) var<storage, read> instanceMatrix: array<InstanceMatrix>;`;
export const SHADER_INSTANCE_MATRIAL_STORAGE = `@group(3) @binding(21) var<storage, read> instanceMatrial: array<Matrial>;`;
export const SHADER_BUILTIN_INPUT = `@builtin(instance_index) instance_index:u32`;
export const SHADER_INSTANCE_FRAGMENT_DEFAULT = `
@LIGHT_STRUCTS_UNIFORMS

@LIGHT_FUNCTIONS

fn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f, specualrShininess:f32, specualrStrength:f32, specualrColor:vec3f) -> vec4f{
  var specualr = pow(max(dot(r.xyz,v.xyz), 0), specualrShininess) * specualrStrength;
  var color = lightColor.xyz;
  var result = color*specualr * specualrColor;
  return vec4f(result,1);
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var finalColor=vec4f();
  var x = cameraPos.x;

  var specualrShininess= instanceMatrial[out.instance_index].specualrShininess;
  var specualrStrength= instanceMatrial[out.instance_index].specualrStrength;
  var specualrColor= instanceMatrial[out.instance_index].specualrColor.xyz;

  @LIGHT_CODES

  finalColor.a = out.color.a;
  return finalColor;
}`;
export const SHADER_INSTANCE_VERTEX = `
  @vertex
  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {
  var out:VertexOut;
  var model = instanceMatrix[instance_index].modelMatrix;
  var normalizeNormal = instanceMatrix[instance_index].normalMatrix;
  var color = instanceMatrial[instance_index].baseColor;

  out.position = vpMatrix * model * vec4f(pos,1);
  out.normal = normalize(normalizeNormal * vec4f(normal,0));
  out.color = color;
  out.world_position = model * vec4f(pos,1);
  out.instance_index = instance_index;
  out.uv = uv;
  
  return out;
}`;
//# sourceMappingURL=shader_instance.js.map