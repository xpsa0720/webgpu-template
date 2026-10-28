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
if (castShadow) {
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
}`;

export const SHADOW_INSTANCE_DIRECTIONAL_ADD_FUNC = `

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
