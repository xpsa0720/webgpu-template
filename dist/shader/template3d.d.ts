import { ShaderAmbientLightGadget, ShaderDirectionalLightGadget, ShaderPointLightGadget } from "./gadget/shader_light";
export declare const SHADER_FRAGMENT_DEFAULT = "\n@LIGHT_STRUCTS_UNIFORMS\n\n@LIGHT_FUNCTIONS\n\n@fragment\nfn fs(out: VertexOut) -> @location(0) vec4f {\n  var finalColor=vec4f();\n\n  @LIGHT_CODES\n\n  return vec4f(1,1,1,1);\n}";
export declare const POINT_LIGHT_CODE: ShaderPointLightGadget;
export declare const AMBIENT_LIGHT_CODE: ShaderAmbientLightGadget;
export declare const DIRECTIONAL_LIGHT_CODE: ShaderDirectionalLightGadget;
//# sourceMappingURL=template3d.d.ts.map