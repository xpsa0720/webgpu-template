struct Matrixs{
  mvpMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>
}

struct PointLight{
  position: vec3f,
  intensity: f32,
  color: vec4f
}
struct AmbientLight{
  intensity: f32,
  color: vec4f
}

struct DirectionalLight{
  directional: vec3f,
  intensity: f32,
  color: vec4f
}

struct VertexOut{
  @builtin(position) position:vec4f,
  @location(0) normal:vec4f,
}

@group(3) @binding(0) var<uniform> matrix:Matrixs;

@group(4) @binding(0) var<uniform> pointLight:array<PointLight, @POINT_LIGHT_COUNT>;
@group(4) @binding(1) var<uniform> ambientLight:array<AmbientLight, @AMBIENT_LIGHT_COUNT>;
@group(4) @binding(2) var<uniform> directionalLight:array<AmbientLight, @DIRECTIONAL_LIGHT_COUNT>;

@vertex
fn vs(@location(0) pos: vec3f, @location(1) normal: vec3f) -> VertexOut {
  var out:VertexOut;

  out.position = matrix.mvpMatrix * vec4f(pos,1);
  out.normal = matrix.normalMatrix * vec4f(normal,0);

  return out;
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  return vec4f(1,1,1,1);
}
