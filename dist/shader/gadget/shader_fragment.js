import { ShaderAmbientLightGadget, ShaderDirectionalLightGadget, ShaderPointLightGadget, } from "./shader_light";
import { ShaderGadget } from "./shader_gadget";
import { AMBIENT_LIGHT, DIRECTIONAL_LIGHT, POINT_LIGHT, SHADER_FRAGMENT_DEFAULT, } from "./code/shader_code";
export class ShaderFragmentGadget extends ShaderGadget {
    device;
    code;
    constructor({ placeholder = {}, device, code }) {
        super({ placeholder });
        this.device = device;
        this.code = code ?? SHADER_FRAGMENT_DEFAULT;
        // this.updatePlaceholder();
        // this.updateBindGroupEntray();
    }
    // private wrapLightChange(): () => void {
    //   return () => {
    //     // this.updatePlaceholder();
    //     this.onLightChange?.();
    //   // this.updateBindGroupEntray();
    //   };
    // }
    buildCode(arg) {
        this.placeholder["@LIGHT_STRUCTS_UNIFORMS"] = arg.lightStructsUniforms;
        this.placeholder["@LIGHT_CODES"] = arg.lightCode;
        this.placeholder["@LIGHT_FUNCTIONS"] = arg.funtionCode;
        this.placeholder["@SHADOW_DEFINES"] = arg.shadowDefinesCode;
        let result = this.code;
        return super.getCode(result);
    }
}
//# sourceMappingURL=shader_fragment.js.map