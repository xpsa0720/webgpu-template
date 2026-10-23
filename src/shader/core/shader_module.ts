
import { SHADER_CAMERA_POSITION_UNIFORM, SHADER_INSTANCE_FLAG_UNIFORM,  SHADER_MATRIAL_STRUCT, SHADER_MATRIAL_UNIFORM, SHADER_MATRIX_STRUCT, SHADER_MATRIX_UNIFORM, SHADER_VERTEXOUT_STRUCT } from "../gadget/code/shader_code";
import { SHADER_INSTANCE_MATRIX_STORAGE } from "../gadget/code/shader_instance";
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

export abstract class ShaderGadgetModule {
  module: ShaderModuleStruct;
  // bindGroupEntry!:GPUBindGroupEntry[];
  private viewShaderCode: boolean;

  constructor({
    device,
    viewShaderCode = false,
  }: ShaderGadgetModuleParams) {
    this.viewShaderCode = viewShaderCode;
    this.module = this.createShaderModule(device)
    // this.bindGroupEntry = this.updateBindGroupEntray()
    // {
    //   structs: [
    //     new ShaderStructGadget({ struct: SHADER_MATRIX_STRUCT }),
    //     new ShaderStructGadget({ struct: SHADER_VERTEXOUT_STRUCT }),
    //     new ShaderStructGadget({ struct: SHADER_MATRIAL_STRUCT }),
    //   ],
    //   bindings: [
    //     new ShaderbindingGadget({
    //       define: SHADER_CAMERA_POSITION_UNIFORM,
    //       type: "uniform",
    //     }),
    //     ...bindings,
    //   ],
    //   vertex: new ShaderVertexGadget({ device, code: vertexCode }),
    //   fragment: new ShaderFragmentGadget({ device, code: fragmentCode }),
    // };
  }

  getSourceCode(lightArg?: {
    lightStructsUniforms: string;
    lightCode: string;
    funtionCode: string;
  }): string {
    let result = "";

    this.module.structs.forEach((e, i) => {
      result += e.getCode()+"\n";
    });

    this.module.bindings.forEach((e, i) => {
      result += e.getCode()+"\n";
    });

    result += this.module.vertex.getCode();
    result += this.module.fragment.buildCode(lightArg ?? {
      lightStructsUniforms: "",
      lightCode: "",
      funtionCode: "",
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

  getVertexLayout(): GPUVertexBufferLayout[] {
    return this.module.vertex.getVertexLayout();
  }


  // abstract updateBindGroupEntray():GPUBindGroupEntry[]
  abstract createShaderModule(device:GPUDevice):ShaderModuleStruct
  // {
  //   const result: GPUBindGroupEntry[] = [];

  //   this.lights.forEach((e) => {
  //     if (e.lights.length === 0) return;
  //     result.push({ binding: e.binding, resource: { buffer: e.gpuBuffer.buffer } });
  //   });

  //   this.bindGroupEntry =result;
  // }
}
