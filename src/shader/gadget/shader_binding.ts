import { applyVariableShaderCode } from "../../util/compile";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";

export interface ShaderbindingGadgetParams extends ShaderGadgetParams{
  define: string;
  type: 'texture' | 'uniform' | 'storage' | 'sampler'
}

export class ShaderbindingGadget extends ShaderGadget{
  define: string;
  type: 'texture' | 'uniform' | 'storage' | 'sampler'
  
  constructor({define, placeholder={}, type}:ShaderbindingGadgetParams) {
    super({placeholder})
    this.define = define
    this.type = type
  }

  getCode(){
    let result = ''
    result+=this.define

    return super.getCode(result);
  }
}