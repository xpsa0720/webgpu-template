// 1D compute: 시간에 따라 metaball 소스 위치를 갱신
// workgroup size는 const로 고정 → ComputePass가 셰이더에서 64를 읽어 디스패치 계산
struct Params {
  aspectRatio : f32,
  resolutionX : f32,
  resolutionY : f32,
  time        : f32,
};

const WG = 64u;

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read_write> sources : array<vec4f>;

@compute @workgroup_size(WG)
fn main(@builtin(global_invocation_id) id : vec3u) {
  let i = id.x;
  if (i >= arrayLength(&sources)) {
    return;
  }
  let fi = f32(i);
  let t = params.time * (0.3 + 0.05 * fi);
  let pos = vec2f(
    0.5 + 0.35 * sin(t + fi * 1.7),
    0.5 + 0.35 * cos(t * 1.3 + fi * 2.3),
  );
  let radius = 0.03 + 0.01 * fract(fi * 0.618);
  sources[i] = vec4f(pos, radius, 0.0);
}
