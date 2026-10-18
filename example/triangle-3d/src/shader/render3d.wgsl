struct Matrixs{
  mvpMartrix: mat4x4<f32>,
}

@group(3) @binding(0) var<uniform> martrix:Matrixs;

@vertex
fn vs(@location(0) pos: vec3f) -> @builtin(position) vec4f {
  return martrix.mvpMartrix * vec4f(pos,1);
}

@fragment
fn fs() -> @location(0) vec4f {
  return vec4f(1,1,1,1);
}
