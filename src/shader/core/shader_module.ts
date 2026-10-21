import {
  SHADER_CAMERA_POSITION_UNIFORM,
  SHADER_MATRIAL_UNIFORM,
  SHADER_MATRIX_UNIFORM,
} from "../gadget/basic/bindings";
import {
  SHADER_MATRIAL_STRUCT,
  SHADER_MATRIX_STRUCT,
  SHADER_VERTEXOUT_STRUCT,
} from "../gadget/basic/structs";
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

export class ShaderGadgetModule {
  module: ShaderModuleStruct;

  constructor(device: GPUDevice, onLightChange?: () => void) {
    this.module = {
      structs: [
        new ShaderStructGadget({ struct: SHADER_MATRIX_STRUCT }),
        new ShaderStructGadget({ struct: SHADER_VERTEXOUT_STRUCT }),
        new ShaderStructGadget({ struct: SHADER_MATRIAL_STRUCT }),
      ],
      bindings: [
        new ShaderbindingGadget({
          define: SHADER_MATRIX_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_CAMERA_POSITION_UNIFORM,
          type: "uniform",
        }),
        new ShaderbindingGadget({
          define: SHADER_MATRIAL_UNIFORM,
          type: "uniform",
        }),
      ],
      vertex: new ShaderVertexGadget({}),
      fragment: new ShaderFragmentGadget({ device, onLightChange }),
    };
  }

  getSourceCode(): string {
    let result = "";

    this.module.structs.forEach((e, i) => {
      result += e.getCode()+"\n";
    });

    this.module.bindings.forEach((e, i) => {
      result += e.getCode()+"\n";
    });

    result += this.module.vertex.getCode();
    result += this.module.fragment.getCode();

    console.log(result)

    return result;
  }

  getVsEntryPoint() {
    return "vs";
  }

  getFsEntryPoint() {
    return "fs";
  }

  getVertexLayout(): GPUVertexBufferLayout[] {
    return this.module.vertex.getVertexLayout();
  }
}
