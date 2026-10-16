struct Matrixs{
  mvpMartrix: mat4x4<f32>,
}

struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(3) @binding(0) var<uniform> martrix:Matrixs;

@vertex
fn vs(@location(0) pos: vec3f) -> VSOutput {
  var out: VSOutput;
  out.position = martrix.mvpMartrix * vec4f(pos,1);

  out.color = vec4f(1,1,1,1);
  
  return out;
}

@fragment
fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
