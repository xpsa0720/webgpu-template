import { SHADER_CAMERA_POSITION_UNIFORM, SHADER_LIGHT_COUNTS_UNIFORM, SHADER_MATRIAL_SAMPLER, SHADER_MATRIAL_STRUCT, SHADER_MATRIAL_TEXTURE, SHADER_VERTEXOUT_STRUCT, } from "../gadget/code/shader_code";
import { SHADER_INSTANCE_FRAGMENT_DEFAULT, SHADER_INSTANCE_MATRIAL_STORAGE, SHADER_INSTANCE_MATRIX_STORAGE, SHADER_INSTANCE_MATRIX_STRUCT, SHADER_INSTANCE_VERTEX, SHADER_INSTANCE_VP_UNIFORM, } from "../gadget/code/shader_instance";
import { ShaderbindingGadget } from "../gadget/shader_binding";
import { ShaderFragmentGadget } from "../gadget/shader_fragment";
import { ShaderStructGadget } from "../gadget/shader_struct";
import { ShaderVertexGadget } from "../gadget/shader_vertex";
import { ShaderGadgetModule, } from "./shader_module";
export class ShaderGadgetInstanceMeshModule extends ShaderGadgetModule {
    constructor(arg) {
        super(arg);
    }
    createShaderModule(device) {
        return {
            structs: [
                new ShaderStructGadget({ struct: SHADER_INSTANCE_MATRIX_STRUCT }),
                new ShaderStructGadget({ struct: SHADER_VERTEXOUT_STRUCT }),
                new ShaderStructGadget({ struct: SHADER_MATRIAL_STRUCT }),
            ],
            bindings: [
                new ShaderbindingGadget({
                    define: SHADER_INSTANCE_VP_UNIFORM,
                    type: "uniform",
                }),
                new ShaderbindingGadget({
                    define: SHADER_CAMERA_POSITION_UNIFORM,
                    type: "uniform",
                }),
                new ShaderbindingGadget({
                    define: SHADER_LIGHT_COUNTS_UNIFORM,
                    type: "uniform",
                }),
                new ShaderbindingGadget({
                    define: SHADER_INSTANCE_MATRIX_STORAGE,
                    type: "storage",
                }),
                new ShaderbindingGadget({
                    define: SHADER_INSTANCE_MATRIAL_STORAGE,
                    type: "storage",
                }),
                new ShaderbindingGadget({
                    define: SHADER_MATRIAL_TEXTURE,
                    type: "texture",
                }),
                new ShaderbindingGadget({
                    define: SHADER_MATRIAL_SAMPLER,
                    type: "sampler",
                }),
            ],
            vertex: new ShaderVertexGadget({ device, code: SHADER_INSTANCE_VERTEX }),
            fragment: new ShaderFragmentGadget({
                device,
                code: SHADER_INSTANCE_FRAGMENT_DEFAULT,
            }),
        };
    }
}
//# sourceMappingURL=shader_instance_mesh_module.js.map