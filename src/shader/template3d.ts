export const SHADER_VERTEX_INPUT = `@location(0) pos: vec3f, @location(1) normal: vec3f`;

export const SHADER_VERTEX_DEFAULT = `
  @vertex
  fn vs(@VERTEX_INPUT) -> VertexOut {
  var out:VertexOut;

  out.position = matrix.mvpMatrix * vec4f(pos,1);
  out.normal = normalize(matrix.normalMatrix * vec4f(normal,0));
  out.color = vec4f(1,1,1,1);
  out.world_position = matrix.modelMatrix * vec4f(pos,1);

  return out;
}`;

export const SHADER_FRAGMENT_DEFAULT = `
@LIGHT_STRUCTS_UNIFORMS

@LIGHT_FUNCTIONS

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var finalColor=vec4f();
  var x = cameraPos.x;

  @LIGHT_CODES

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
      finalColor+= PointLight_(pointLight[i].position, out.world_position, out.normal, out.color,pointLight[i].color);
    }
    `,
  func: `
    fn PointLight_(lightPosition:vec4f, p:vec4f, normal: vec4f, baseColor: vec4f, lightColor:vec4f) -> vec4f{
    let l = normalize(lightPosition - p);
    let v = normalize(cameraPos - p);
    let r = 2*dot(normal, l)*normal - l;
    let d = abs(lightPosition - p);
  
    let diffuse = max(dot(normal, l), 0);
  
    return (baseColor * diffuse * lightColor) * (1/d*d);
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

export const DIRECTIONAL_LIHGT: ShaderLightGadgetTemplate = {
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
