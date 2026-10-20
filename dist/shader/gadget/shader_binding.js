import { applyVariableShaderCode } from "../../util/compile";
import { ShaderGadget } from "./shader_gadget";
export class ShaderbindingGadget extends ShaderGadget {
    define;
    type;
    constructor({ define, placeholder = {}, type }) {
        super({ placeholder });
        this.define = define;
        this.type = type;
    }
    getCode() {
        let result = '';
        result += this.define;
        return super.getCode(result);
    }
}
//# sourceMappingURL=shader_binding.js.map