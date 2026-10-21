export declare const SHADER_VERTEX_INPUT = "@location(0) pos: vec3f, @location(1) normal: vec3f";
export declare const SHADER_VERTEX_DEFAULT = "\n  @vertex\n  fn vs(@VERTEX_INPUT) -> VertexOut {\n  var out:VertexOut;\n\n  out.position = matrix.mvpMatrix * vec4f(pos,1);\n  out.normal = normalize(matrix.normalMatrix * vec4f(normal,0));\n  out.color = matrial.baseColor;\n  out.world_position = matrix.modelMatrix * vec4f(pos,1);\n\n  return out;\n}";
export declare const SHADER_FRAGMENT_DEFAULT = "\n@LIGHT_STRUCTS_UNIFORMS\n\n@LIGHT_FUNCTIONS\n\nfn Speculer(l:vec4f, r:vec4f,v: vec4f,normal:vec4f, lightColor:vec4f) -> vec4f{\n  var specualr = pow(max(dot(r.xyz,v.xyz), 0), matrial.specualrShininess) * matrial.specualrStrength;\n  var color = lightColor.xyz;\n  var specualrColor = matrial.specualrColor.xyz;\n  var result = color*specualr * specualrColor;\n  return vec4f(result,1);\n}\n\n@fragment\nfn fs(out: VertexOut) -> @location(0) vec4f {\n  var finalColor=vec4f();\n  var x = cameraPos.x;\n\n  @LIGHT_CODES\n\n  finalColor.a = out.color.a;\n  return finalColor;\n}";
export interface ShaderLightGadgetTemplate {
    struct: string;
    define: string;
    countPlaceholder: string;
    code: string;
    func: string;
}
export declare const POINT_LIGHT: ShaderLightGadgetTemplate;
export declare const AMBIENT_LIGHT: ShaderLightGadgetTemplate;
export declare const DIRECTIONAL_LIHGT: ShaderLightGadgetTemplate;
//# sourceMappingURL=template3d.d.ts.map