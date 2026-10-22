import { ShaderbindingGadget } from "../gadget/shader_binding";
import { ShaderFragmentGadget } from "../gadget/shader_fragment";
import { ShaderStructGadget } from "../gadget/shader_struct";
import { ShaderVertexGadget } from "../gadget/shader_vertex";
export interface ShaderModuleStruct {
    structs: ShaderStructGadget[];
    bindings: ShaderbindingGadget[];
    vertex: ShaderVertexGadget;
    fragment: ShaderFragmentGadget;
}
export declare class ShaderGadgetModule {
    module: ShaderModuleStruct;
    private viewShaderCode;
    constructor(device: GPUDevice, onLightChange?: () => void, viewShaderCode?: boolean);
    getSourceCode(): string;
    getVsEntryPoint(): string;
    getFsEntryPoint(): string;
    getVertexLayout(): GPUVertexBufferLayout[];
}
//# sourceMappingURL=shader_module.d.ts.map