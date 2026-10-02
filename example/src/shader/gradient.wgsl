struct Params {
  aspectRatio : f32,
  resolutionX : f32,
  resolutionY : f32,
  time        : f32,
};

@group(0) @binding(0) var<uniform> params : Params;

struct VertexOut {
  @builtin(position) pos : vec4f,
  @location(0)       uv  : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32) -> VertexOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  let p = positions[vi];
  var out : VertexOut;
  out.pos = vec4f(p, 0.0, 1.0);
  out.uv  = p * 0.5 + 0.5; // [0,1] 범위로 변환
  return out;
}

@fragment
fn fs(in : VertexOut) -> @location(0) vec4f {
  let t = params.time;
  let uv = in.uv;

  let r = 0.5 + 0.5 * sin(t + uv.x * 3.0);
  let g = 0.5 + 0.5 * sin(t * 1.3 + uv.y * 3.0 + 2.094);
  let b = 0.5 + 0.5 * sin(t * 0.7 + (uv.x + uv.y) * 2.0 + 4.189);

  return vec4f(r, g, b, 1.0);
}
