// ── Directional Light Shadow ──

export const SHADOW_DIRECTIONAL_COMPARE = `
if (directionalLight[i].castShadow == 0) {
  noneDirectionalShadowCount += 1;
  castShadow = false;
    }
if(matrial.receiveShadow == 0){
  castShadow = false;
  reciveShadow = false;
}  
`;

export const SHADOW_INSTANCE_DIRECTIONAL_COMPARE = `
if (directionalLight[i].castShadow == 0) {
  noneDirectionalShadowCount += 1;
  castShadow = false;
}
if(instanceMatrial[out.instance_index].receiveShadow == 0){
  castShadow = false;
  reciveShadow = false;
}  
`;

export const SHADOW_DIRECTIONAL_ADD_FUNC = `
if castShadow {
    visibilty = 0f;
    let dimensions = vec2f(textureDimensions(directionalShadowTexture));
    let texelSize = vec2f(1.0) / dimensions;
    let pvMatrix = directionalLightPVMatrix[lightIndex];
    let lightClip = pvMatrix * worldPos;
    let range = i32(floor(shadowKernelLength/2));
    let ndc = lightClip.xyz / lightClip.w;

    let shadowUV = vec2f((ndc.x + 1.0) * 0.5, (1.0 - ndc.y) * 0.5);

    
    for(var y = -range; y <= range; y++) {
        for(var x = -range; x <= range; x++) {
            let offset = vec2f(f32(x), f32(y));
            let sampleUV = shadowUV + offset * texelSize;
            visibilty += textureSampleCompare(
                    directionalShadowTexture,
                    shadowSampler,
                    sampleUV,
                    lightIndex,
                    ndc.z,
                );
        }
    }

    visibilty /= shadowKernelLength*shadowKernelLength;
}`;

export const SHADOW_INSTANCE_DIRECTIONAL_ADD_FUNC = `
    visibilty = 0f;
    let dimensions = vec2f(textureDimensions(directionalShadowTexture));
    let texelSize = vec2f(1.0) / dimensions;
    let pvMatrix = directionalLightPVMatrix[lightIndex];
    let lightClip = pvMatrix * worldPos;
    let range = i32(floor(shadowKernelLength/2));
    let ndc = lightClip.xyz / lightClip.w;

    let shadowUV = vec2f((ndc.x + 1.0) * 0.5, (1.0 - ndc.y) * 0.5);

    
    for(var y = -range; y <= range; y++) {
        for(var x = -range; x <= range; x++) {
            let offset = vec2f(f32(x), f32(y));
            let sampleUV = shadowUV + offset * texelSize;
            visibilty += textureSampleCompare(
                    directionalShadowTexture,
                    shadowSampler,
                    sampleUV,
                    lightIndex,
                    ndc.z,
                );
        }
    }
    visibilty /= shadowKernelLength*shadowKernelLength;
if(reciveShadow || castShadow){
  visibilty = 1;
}  
`;

// ── Point Light Shadow ──

export const SHADOW_POINT_COMPARE = `
if (pointLight[i].castShadow == 0) {
  nonePointShadowCount += 1;
}
if(matrial.receiveShadow == 0){
  castShadow = false;
}`;

export const SHADOW_INSTANCE_POINT_COMPARE = `
if (pointLight[i].castShadow == 0) {
  nonePointShadowCount += 1;
}
if(instanceMatrial[out.instance_index].receiveShadow == 0){
  castShadow = false;
}`;

export const SHADOW_POINT_ADD_FUNC = `
if (castShadow) {
  let pvMatrix = pointLightPVMatrix[lightIndex];
  let lightClip = pvMatrix * worldPos;

  let ndc = lightClip.xyz / lightClip.w;

  let shadowUV = vec2f((ndc.x + 1.0) * 0.5, (1.0 - ndc.y) * 0.5);
  visibilty = textureSampleCompare(
          pointShadowTexture,
          shadowSampler,
          shadowUV,
          lightIndex,
          ndc.z,
      );
}`;

export const SHADOW_INSTANCE_POINT_ADD_FUNC = `

let pvMatrix = pointLightPVMatrix[lightIndex];
let lightClip = pvMatrix * worldPos;

let ndc = lightClip.xyz / lightClip.w;

let shadowUV = vec2f((ndc.x + 1.0) * 0.5, (1.0 - ndc.y) * 0.5);
visibilty = textureSampleCompare(
        pointShadowTexture,
        shadowSampler,
        shadowUV,
        lightIndex,
        ndc.z,
    );
if(reciveShadow || castShadow){
  visibilty = 1;
}
`;
