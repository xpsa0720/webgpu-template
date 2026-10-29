import { ShaderbindingGadget } from "../gadget/shader_binding";
import { ShaderFragmentGadget } from "../gadget/shader_fragment";
import { ShaderStructGadget } from "../gadget/shader_struct";
import { ShaderVertexGadget } from "../gadget/shader_vertex";
export class ShaderGadgetModule {
    module;
    // bindGroupEntry!:GPUBindGroupEntry[];
    viewShaderCode;
    constructor({ device, viewShaderCode = false, }) {
        this.viewShaderCode = viewShaderCode;
        this.module = this.createShaderModule(device);
    }
    getSourceCode(lightArg) {
        let result = "";
        this.module.structs.forEach((e, i) => {
            result += e.getCode() + "\n";
        });
        this.module.bindings.forEach((e, i) => {
            result += e.getCode() + "\n";
        });
        result += this.module.vertex.getCode();
        result += this.module.fragment.buildCode(lightArg ?? {
            lightStructsUniforms: "",
            lightCode: "",
            functionCode: "",
            shadowDefinesCode: ""
        });
        if (this.viewShaderCode) {
            console.log(result);
        }
        return result;
    }
    getVsEntryPoint() {
        return "vs";
    }
    getFsEntryPoint() {
        return "fs";
    }
    getVertexLayout() {
        return this.module.vertex.getVertexLayout();
    }
}
//# sourceMappingURL=shader_module.js.map