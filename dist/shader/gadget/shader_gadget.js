import { applyVariableShaderCode } from "../../util/compile";
export class ShaderGadget {
    placeholder;
    constructor({ placeholder = {} }) {
        this.placeholder = placeholder;
    }
    getCode(code) {
        return applyVariableShaderCode(code, this.placeholder);
    }
}
//# sourceMappingURL=shader_gadget.js.map