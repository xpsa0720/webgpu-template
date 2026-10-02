// ============================================================
// checker.wgsl — 텍스처 + 샘플러 사용 예제
// group 0: Params(uniform), group 1: texture, group 2: sampler
// ============================================================

struct Params {
    aspectRatio: f32,
    resolutionX: f32,
    resolutionY: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(1) @binding(0) var tex: texture_2d<f32>;
@group(2) @binding(0) var texSampler: sampler;

struct VOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

// 정점 데이터 없이 vertex_index만으로 풀스크린 삼각형 생성
@vertex
fn vMain(@builtin(vertex_index) idx: u32) -> VOut {
    var positions = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f(3.0, -1.0),
        vec2f(-1.0, 3.0),
    );
    var uvs = array<vec2f, 3>(
        vec2f(0.0, 1.0),
        vec2f(2.0, 1.0),
        vec2f(0.0, -1.0),
    );

    var out: VOut;
    out.pos = vec4f(positions[idx], 0.0, 1.0);
    out.uv = uvs[idx];
    return out;
}

@fragment
fn fMain(in: VOut) -> @location(0) vec4f {
    // aspectRatio를 실제로 사용 — 체커 칸이 정사각형으로 보이도록 uv.x 보정
    let uv = vec2f(in.uv.x * params.aspectRatio, in.uv.y);
    return textureSample(tex, texSampler, uv);
}
