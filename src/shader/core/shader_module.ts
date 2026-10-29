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
  }

  getSourceCode(lightArg?: {
    lightStructsUniforms: string;
    lightCode: string;
    functionCode: string;
    shadowDefinesCode: string;
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

  getVertexLayout(): GPUVertexBufferLayout[] {
    return this.module.vertex.getVertexLayout();
  }


  // abstract updateBindGroupEntry():GPUBindGroupEntry[]
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
