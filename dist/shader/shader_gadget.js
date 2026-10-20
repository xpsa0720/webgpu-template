import { applyVariableShaderCode } from "../util/compile";
export class ShaderStructGadget {
    uniform;
    struct;
    placeholder;
    constructor({ uniform, struct, placeholder = {} }) {
        this.uniform = uniform;
        this.struct = struct;
        this.placeholder = placeholder;
    }
    getCode() {
        let result = '';
        result += this.struct;
        result += this.uniform;
        result = applyVariableShaderCode(result, this.placeholder);
        return result;
    }
}
//# sourceMappingURL=shader_gadget.js.map