export declare const SHADER_VERTEX_INPUT = "@location(0) pos: vec3f, @location(1) normal: vec3f";
export declare const SHADER_VERTEX_DEFAULT = "\n  @vertex\n  fn vs(@VERTEX_INPUT) -> VertexOut {\n  var out:VertexOut;\n\n  out.position = matrix.mvpMatrix * vec4f(pos,1);\n  out.normal = normalize(matrix.normalMatrix * vec4f(normal,0));\n  out.color = vec4f(1,1,1,1);\n  out.world_position = matrix.modelMatrix * vec4f(pos,1);\n\n  return out;\n}";
export declare const SHADER_FRAGMENT_DEFAULT = "\n@LIGHT_STRUCTS_UNIFORMS\n\n@LIGHT_FUNCTIONS\n\n@fragment\nfn fs(out: VertexOut) -> @location(0) vec4f {\n  var finalColor=vec4f();\n  var x = cameraPos.x;\n\n  @LIGHT_CODES\n\n  return finalColor;\n}";
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