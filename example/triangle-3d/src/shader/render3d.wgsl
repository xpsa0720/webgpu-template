struct Matrixs{
  mvpMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>
}

struct VertexOut{
  @builtin(position) position:vec4f,
  @location(0) normal:vec4f,
  @location(1) color:vec4f,
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

@group(3) @binding(0) var<uniform> matrix:Matrixs;
@group(3) @binding(1) var<uniform> cameraPos:vec4f;


@group(4) @binding(0) var<uniform> pointLight:array<PointLight, @POINT_LIGHT_COUNT>;
@group(4) @binding(1) var<uniform> ambientLight:array<AmbientLight, @AMBIENT_LIGHT_COUNT>;
@group(4) @binding(2) var<uniform> directionalLight:array<AmbientLight, @DIRECTIONAL_LIGHT_COUNT>;

fn PointLight_(lightPosition:vec4f, p:vec4f, normal: vec4f, baseColor: vec4f, lightColor:vec4f) -> vec4f{
  let l = normalize(lightPosition - p);
  let v = normalize(cameraPos - p);
  let r = 2*dot(normal, l)*normal - l;

  let diffuse = max(dot(normal, l), 0);

  return baseColor * diffuse * lightColor;
}


@vertex
fn vs(@location(0) pos: vec3f, @location(1) normal: vec3f) -> VertexOut {
  var out:VertexOut;

  out.position = matrix.mvpMatrix * vec4f(pos,1);
  out.normal = matrix.normalMatrix * vec4f(normal,0);
  out.color = vec4f(1,1,1,1);
  return out;
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
  var finalColor=vec4f();
  
  for(var i=0; i< @POINT_LIGHT_COUNT; i++){
    finalColor+= PointLight_(pointLight[i].position,out.position, out.normal, out.color,pointLight[i].color);
  }


  return vec4f(1,1,1,1);
}
