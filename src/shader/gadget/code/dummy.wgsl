
struct VertexOut{
  @builtin(position) position:vec4f,
}

@group(3) @binding(19) var directionalShadowTexture: texture_depth_2d_array;

fn Shadow(worldPos:vec4f){
  let lightClip = worldPos;
  textureSampleCompare(shadowMap, shadowSampler, shadowUV, ndc.z)
}


@group(0) @binding(0) var<uniform> mMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> vpMatrix:mat4x4<f32>;

@vertex
fn vs(@location(0) pos: vec3f) -> VertexOut {
  var out:VertexOut;
  out.position = vpMatrix * mMatrix * vec4f(pos,1);
  
  return out;
}  

@fragment
fn fs(out: VertexOut) {}