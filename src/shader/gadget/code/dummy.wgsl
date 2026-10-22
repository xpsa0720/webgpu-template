struct Matrixs {
    mvpMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    modelMatrix: mat4x4<f32>,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec4f,
    @location(1) color: vec4f,
    @location(2) world_position: vec4f,
}

struct Matrial {
    baseColor: vec4f,
    specualrColor: vec4f,
    specualrStrength: f32,
    specualrShininess: f32,
}
@group(3) @binding(0)
var<uniform> matrix: Matrixs;
@group(3) @binding(1)
var<uniform> cameraPos: vec4f;
@group(3) @binding(2)
var<uniform> matrial: Matrial;

@vertex
fn vs(@location(0) pos: vec3f, @location(1) normal: vec3f, @builtin(instance_index) instance_index : u32 ) -> VertexOut {
    var out: VertexOut;

    out.position = matrix.mvpMatrix * vec4f(pos, 1);
    out.normal = normalize(matrix.normalMatrix * vec4f(normal, 0));
    out.color = matrial.baseColor;
    out.world_position = matrix.modelMatrix * vec4f(pos, 1);

    return out;
}
struct PointLight {
    position: vec4f,
    intensity: f32,
    color: vec4f,
}
@group(3) @binding(10)
var<uniform> pointLight: array<PointLight, 1>;

struct AmbientLight {
    intensity: f32,
    color: vec4f,
}
@group(3) @binding(11)
var<uniform> ambientLight: array<AmbientLight, 1>;

fn PointLight_(
    lightPosition: vec4f,
    p: vec4f,
    normal: vec4f,
    baseColor: vec4f,
    lightColor: vec4f,
    intensity: f32,
) -> vec4f {
    let l = normalize(lightPosition - p);
    let v = normalize(cameraPos - p);
    let r = 2 * dot(normal, l) * normal - l;
    let dist = length(lightPosition.xyz - p.xyz);
    let attenuation = intensity / (dist * dist);

    let diffuse = max(dot(normal, l), 0);
    let diffuseColor = baseColor * diffuse * lightColor;
    let specularColor = Speculer(l, r, v, normal, lightColor);
    return (specularColor + diffuseColor) * attenuation;
}

fn AmbientLight_(baseColor: vec4f, ambient: f32) -> vec4f {
    return baseColor * ambient;
}

fn Speculer(l: vec4f, r: vec4f, v: vec4f, normal: vec4f, lightColor: vec4f) -> vec4f {
    var specualr = pow(max(dot(r.xyz, v.xyz), 0), matrial.specualrShininess)
        * matrial.specualrStrength;
    var color = lightColor.xyz;
    var specualrColor = matrial.specualrColor.xyz;
    var result = color * specualr * specualrColor;
    return vec4f(result, 1);
}

@fragment
fn fs(out: VertexOut) -> @location(0) vec4f {
    var finalColor = vec4f();
    var x = cameraPos.x;

    for(var i = 0; i < 1; i++) {
        finalColor += PointLight_(
                pointLight[i].position,
                out.world_position,
                out.normal,
                out.color,
                pointLight[i].color,
                pointLight[i].intensity,
            );
    }

    for(var i = 0; i < 1; i++) {
        finalColor += AmbientLight_(out.color, ambientLight[i].intensity);
    }

    finalColor.a = out.color.a;
    return finalColor;
}
