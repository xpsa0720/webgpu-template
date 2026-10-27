// ── Directional Light Shadow ──
export const SHADOW_DIRECTIONAL_COMPARE = `
if (directionalLight[i].castShadow == 0) {
  noneDirectionalShadowCount += 1;
  castShadow = false;
    }`;
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
// ── Point Light Shadow ──
export const SHADOW_POINT_COMPARE = `
if (pointLight[i].castShadow == 0) {
  nonePointShadowCount += 1;
    }`;
export const SHADOW_POINT_ADD_FUNC = `
if (pointLight[lightIndex].castShadow == 1) {
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
//# sourceMappingURL=shadow_add.js.map