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
export interface ShaderGadgetModuleParams {
    device: GPUDevice;
    viewShaderCode?: boolean;
}
export declare abstract class ShaderGadgetModule {
    module: ShaderModuleStruct;
    private viewShaderCode;
    constructor({ device, viewShaderCode, }: ShaderGadgetModuleParams);
    getSourceCode(lightArg?: {
        lightStructsUniforms: string;
        lightCode: string;
        functionCode: string;
        shadowDefinesCode: string;
    }): string;
    getVsEntryPoint(): string;
    getFsEntryPoint(): string;
    getVertexLayout(): GPUVertexBufferLayout[];
    abstract createShaderModule(device: GPUDevice): ShaderModuleStruct;
}
//# sourceMappingURL=shader_module.d.ts.map