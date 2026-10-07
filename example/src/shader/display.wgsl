// render: compute 결과(field)를 화면에 표시
struct Params {
  aspectRatio : f32,
  resolutionX : f32,
  resolutionY : f32,
  time        : f32,
};

const GRID = 256u;

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> field : array<f32>;

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
  out.uv  = p * 0.5 + 0.5;
  return out;
}

@fragment
fn fs(in : VertexOut) -> @location(0) vec4f {
  // 정사각형 격자를 화면 비율에 맞춰 가운데 배치
  var uv = in.uv;
  if (params.aspectRatio > 1.0) {
    uv.x = (uv.x - 0.5) * params.aspectRatio + 0.5;
  } else {
    uv.y = (uv.y - 0.5) / params.aspectRatio + 0.5;
  }
  if (any(uv < vec2f(0.0)) || any(uv >= vec2f(1.0))) {
    return vec4f(0.05, 0.05, 0.08, 1.0);
  }
  let cell = vec2u(uv * f32(GRID));
  let v = field[cell.y * GRID + cell.x];

  let edge = smoothstep(0.9, 1.1, v);
  let glow = clamp(v * 0.6, 0.0, 1.0);
  let hue = vec3f(0.5 + 0.5 * sin(params.time + uv.x * 3.0), 0.4, 0.9);
  let color = mix(vec3f(0.05, 0.05, 0.12) + glow * 0.25 * hue, hue, edge);
  return vec4f(color, 1.0);
}
