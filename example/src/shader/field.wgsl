// 2D compute: 격자 각 셀의 metaball 필드 값을 계산
// workgroup size는 @X_AUTO/@Y_AUTO 플레이스홀더 → auto-tuning 대상 (튜닝 전 2D 기본값 8로 치환되어 컴파일)
const GRID = 256u;

@group(0) @binding(0) var<storage, read> sources : array<vec4f>;
@group(0) @binding(1) var<storage, read_write> field : array<f32>;

@compute @workgroup_size(@X_AUTO, @Y_AUTO)
fn main(@builtin(global_invocation_id) id : vec3u) {
  if (id.x >= GRID || id.y >= GRID) {
    return;
  }
  let p = (vec2f(id.xy) + 0.5) / f32(GRID);
  var sum = 0.0;
  for (var i = 0u; i < arrayLength(&sources); i++) {
    let s = sources[i];
    let d = p - s.xy;
    sum += (s.z * s.z) / max(dot(d, d), 1e-6);
  }
  field[id.y * GRID + id.x] = sum;
}
