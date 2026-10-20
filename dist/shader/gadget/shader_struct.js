import { applyVariableShaderCode } from "../../util/compile";
import { ShaderGadget } from "./shader_gadget";
export class ShaderStructGadget extends ShaderGadget {
    struct;
    constructor({ struct, placeholder = {} }) {
        super({ placeholder });
        this.struct = struct;
    }
    getCode() {
        let result = '';
        result += this.struct;
        return super.getCode(result);
    }
}
//# sourceMappingURL=shader_struct.js.map