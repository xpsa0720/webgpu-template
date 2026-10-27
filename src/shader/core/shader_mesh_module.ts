import { SHADER_CAMERA_POSITION_UNIFORM, SHADER_LIGHT_COUNTS_UNIFORM, SHADER_FRAGMENT_DEFAULT, SHADER_MATRIAL_STRUCT, SHADER_MATRIAL_UNIFORM, SHADER_MESH_MATRIX_STRUCT, SHADER_MATRIX_UNIFORM, SHADER_MESH_VP_UNIFORM, SHADER_VERTEX_DEFAULT, SHADER_VERTEXOUT_STRUCT, SHADER_MATRIAL_TEXTURE, SHADER_MATRIAL_SAMPLER } from "../gadget/code/shader_code";
import { ShaderbindingGadget } from "../gadget/shader_binding";
import { ShaderFragmentGadget } from "../gadget/shader_fragment";
import { ShaderStructGadget } from "../gadget/shader_struct";
import { ShaderVertexGadget } from "../gadget/shader_vertex";
import {
  ShaderGadgetModule,
  type ShaderGadgetModuleParams,
  type ShaderModuleStruct,
} from "./shader_module";

export class ShaderGadgetMeshModule extends ShaderGadgetModule {
  constructor(arg: ShaderGadgetModuleParams) {
    super(arg);
  }

  createShaderModule(device:GPUDevice): ShaderModuleStruct {
    return {
      structs: [
        new ShaderStructGadget({ struct: SHADER_MESH_MATRIX_STRUCT }),
        new ShaderStructGadget({ struct: SHADER_VERTEXOUT_STRUCT }),
        new ShaderStructGadget({ struct: SHADER_MATRIAL_STRUCT }),
      ],
      bindings: [
        new ShaderbindingGadget({
          define: SHADER_CAMERA_POSITION_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_LIGHT_COUNTS_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_MATRIX_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_MATRIAL_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_MESH_VP_UNIFORM,
          type: "uniform",
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
      vertex: new ShaderVertexGadget({ device, code: SHADER_VERTEX_DEFAULT }),
      fragment: new ShaderFragmentGadget({ device, code: SHADER_FRAGMENT_DEFAULT }),
    };
  }
}
