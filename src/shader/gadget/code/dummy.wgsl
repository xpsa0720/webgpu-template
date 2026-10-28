struct InstanceMatrix {
    modelMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec4f,
    @location(1) color: vec4f,
    @location(2) world_position: vec4f,
    @interpolate(flat)
    @location(3) instance_index: u32,
    @location(4) uv: vec2f,
}

struct Matrial {
    baseColor: vec4f,
    specualrColor: vec4f,
    specualrStrength: f32,
    specualrShininess: f32,
    texturFlag: u32,
    receiveShadow: u32,
}
@group(3) @binding(0)
var<uniform> vpMatrix: mat4x4<f32>;
@group(3) @binding(1)
var<uniform> cameraPos: vec4f;
@group(3) @binding(13)
var<uniform> lightCounts: vec4<u32>;
@group(3) @binding(30)
var<storage, read> instanceMatrix: array<InstanceMatrix>;
@group(3) @binding(31)
var<storage, read> instanceMatrial: array<Matrial>;
@group(3) @binding(4)
var tex: texture_2d<f32>;
@group(3) @binding(5)
var texSampler: sampler;

@vertex
fn vs(
    @location(0) pos: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
    @builtin(instance_index) instance_index: u32,
) -> VertexOut {
    var out: VertexOut;
    var model = instanceMatrix[instance_index].modelMatrix;
    var normalizeNormal = instanceMatrix[instance_index].normalMatrix;
    var color = instanceMatrial[instance_index].baseColor;

    out.position = vpMatrix * model * vec4f(pos, 1);
    out.normal = normalize(normalizeNormal * vec4f(normal, 0));
    out.color = color;
    out.world_position = model * vec4f(pos, 1);
    out.instance_index = instance_index;
    out.uv = uv;

    return out;
}

struct AmbientLight {
    intensity: f32,
    color: vec4f,
}
@group(3) @binding(11)
var<uniform> ambientLight: array<AmbientLight, 8>;

struct DirectionalLight {
    directional: vec4f,
    intensity: f32,
    color: vec4f,
    castShadow: u32,
}
@group(3) @binding(12)
var<uniform> directionalLight: array<DirectionalLight, 8>;

@group(3) @binding(20)
var shadowSampler: sampler_comparison;
@group(3) @binding(21)
var directionalShadowTexture: texture_depth_2d_array;
@group(3) @binding(22)
var<storage, read> directionalLightPVMatrix: array<mat4x4f>;

fn AmbientLight_(baseColor: vec4f, ambient: f32) -> vec4f {
    return baseColor * ambient;
}

fn DirectionalLight_(
    baseColor: vec4f,
    normal: vec4f,
    intensity: f32,
    directional: vec4f,
    lightColor: vec4f,
    lightIndex: u32,
    worldPos: vec4f,
    castShadow: bool,
    reciveShadow: bool,
) -> vec4f {
    let l = normalize(-directional);
    let diffuse = max(dot(normal, l), 0);

    var visibilty = 1f;

    let pvMatrix = directionalLightPVMatrix[lightIndex];
    let lightClip = pvMatrix * worldPos;

    let ndc = lightClip.xyz / lightClip.w;

    let shadowUV = vec2f((ndc.x + 1.0) * 0.5, (1.0 - ndc.y) * 0.5);
    visibilty = textureSampleCompare(
            directionalShadowTexture,
            shadowSampler,
            shadowUV,
            lightIndex,
            ndc.z,
        );
    if reciveShadow || castShadow {
        visibilty = 1;
    }

    return baseColor * diffuse * lightColor * intensity * visibilty;
}

fn Speculer(
    l: vec4f,
    r: vec4f,
    v: vec4f,
    normal: vec4f,
    lightColor: vec4f,
    specualrShininess: f32,
    specualrStrength: f32,
    specualrColor: vec3f,
) -> vec4f {
    var specualr = pow(max(dot(r.xyz, v.xyz), 0), specualrShininess) * specualrStrength;
    var color = lightColor.xyz;
    var result = color * specualr * specualrColor;
    return vec4f(result, 1);
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
    var baseColor = out.color;
    var texColor = textureSample(tex, texSampler, out.uv);
    if instanceMatrial[out.instance_index].texturFlag == 1 {
        baseColor *= texColor;
    }

    var finalColor = vec4f(0, 0, 0, 0);
    var x = cameraPos.x;
    var normal = normalize(out.normal);

    var specualrShininess = instanceMatrial[out.instance_index].specualrShininess;
    var specualrStrength = instanceMatrial[out.instance_index].specualrStrength;
    var specualrColor = instanceMatrial[out.instance_index].specualrColor.xyz;

    for(var i = 0u; i < lightCounts.y; i++) {
        finalColor += AmbientLight_(baseColor, ambientLight[i].intensity);
    }

    var noneDirectionalShadowCount = 0u;
    for(var i = 0u; i < lightCounts.z; i++) {
        var castShadow = true;
        var reciveShadow = true;

        if directionalLight[i].castShadow == 0 {
            noneDirectionalShadowCount += 1;
            castShadow = false;
        }
        if instanceMatrial[out.instance_index].receiveShadow == 0 {
            castShadow = false;
            reciveShadow = false;
        }

        finalColor += DirectionalLight_(
                baseColor,
                normal,
                directionalLight[i].intensity,
                directionalLight[i].directional,
                directionalLight[i].color,
                i - noneDirectionalShadowCount,
                out.world_position,
                castShadow,
                reciveShadow,
            );
    }

    finalColor.a = out.color.a;
    return finalColor;
}
