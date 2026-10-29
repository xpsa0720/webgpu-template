struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) uv:vec2f 
}

@group(0) @binding(0)
var tex: texture_2d<f32>;
@group(0) @binding(1)
var texSampler: sampler;
@group(0) @binding(2) var<uniform> aspect: f32;

@vertex
fn vs(@builtin(vertex_index) vertex_index: u32) -> VertexOut {
    var out: VertexOut;

    var globalVertex = array<vec2f, 6>(
            vec2f(-1, -1),
            vec2f(1, -1),
            vec2f(-1, 1),
            vec2f(-1, 1),
            vec2f(1, -1),
            vec2f(-1, -1),
        );
    var vertex = globalVertex[vertex_index];
    vertex.x /= aspect;
    out.uv = vec2f((vertex.x + 1) / 2, (1 - vertex.y) / 2);

    return out;
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
    return textureSample(tex, texSampler, out.uv);
}
