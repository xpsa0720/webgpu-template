
import { SHADER_CAMERA_POSITION_UNIFORM, SHADER_INSTANCE_FLAG_UNIFORM, SHADER_MATRIAL_STRUCT, SHADER_MATRIAL_UNIFORM, SHADER_MATRIX_STRUCT, SHADER_MATRIX_UNIFORM, SHADER_VERTEXOUT_STRUCT } from "../gadget/code/shader_code";
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
  private viewShaderCode: boolean;

  constructor(device: GPUDevice, onLightChange?: () => void, viewShaderCode = false) {
    this.viewShaderCode = viewShaderCode;
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
        new ShaderbindingGadget({
          define: SHADER_INSTANCE_FLAG_UNIFORM,
          type: "uniform",
        }),
      ],
      vertex: new ShaderVertexGadget({ device }),
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

  getVertexLayout(): GPUVertexBufferLayout[] {
    return this.module.vertex.getVertexLayout();
  }
}
