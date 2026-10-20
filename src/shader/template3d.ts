import {
  ShaderAmbientLightGadget,
  ShaderDirectionalLightGadget,
  ShaderPointLightGadget,
} from "./gadget/shader_light";

export const SHADER_FRAGMENT_DEFAULT = `
@LIGHT_STRUCTS_UNIFORMS

@LIGHT_FUNCTIONS

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var finalColor=vec4f();

  @LIGHT_CODES

  return vec4f(1,1,1,1);
}`;

export const POINT_LIGHT_CODE = new ShaderPointLightGadget({
  struct: `struct PointLight{
  position: vec3f,
  intensity: f32,
  color: vec4f
}`,
  define: `@group(4) @binding(0) var<uniform> pointLight:array<PointLight, @POINT_LIGHT_COUNT>;`,
  placeholder: { "@POINT_LIGHT_COUNT": "1" },
  countPlaceholder: "@POINT_LIGHT_COUNT",
  group: 4,
  binding: 0,
  code: "",
  func:`
  fn PointLight_(lightPosition:vec4f, p:vec4f, normal: vec4f, baseColor: vec4f, lightColor:vec4f) -> vec4f{
  let l = normalize(lightPosition - p);
  let v = normalize(cameraPos - p);
  let r = 2*dot(normal, l)*normal - l;

  let diffuse = max(dot(normal, l), 0);

  return baseColor * diffuse * lightColor;
}`
});

export const AMBIENT_LIGHT_CODE = new ShaderAmbientLightGadget({
  struct: `struct AmbientLight{
  intensity: f32,
  color: vec4f
}`,
  define: `@group(4) @binding(1) var<uniform> ambientLight:array<AmbientLight, @AMBIENT_LIGHT_COUNT>;`,
  placeholder: { "@AMBIENT_LIGHT_COUNT": "1" },
  countPlaceholder: "@AMBIENT_LIGHT_COUNT",
  group: 4,
  binding: 1,
  code: "",
  func:``
});

export const DIRECTIONAL_LIGHT_CODE = new ShaderDirectionalLightGadget({
  struct: `struct DirectionalLight{
  directional: vec3f,
  intensity: f32,
  color: vec4f
}`,
  define: `@group(4) @binding(2) var<uniform> directionalLight:array<DirectionalLight, @DIRECTIONAL_LIGHT_COUNT>;`,
  placeholder: { "@DIRECTIONAL_LIGHT_COUNT": "1" },
  countPlaceholder: "@DIRECTIONAL_LIGHT_COUNT",
  group: 4,
  binding: 2,
  code: "",
  func:``
});
