import { applyVariableShaderCode } from "../../util/compile";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";

export interface ShaderStructGadgetParams extends ShaderGadgetParams{
  struct: string;
}

export class ShaderStructGadget extends ShaderGadget{
  struct: string;
  
  constructor({struct,placeholder={}}:ShaderStructGadgetParams) {
    super({placeholder})
    this.struct = struct
  }

  getCode(){
    let result = ''
    result+=this.struct

    return super.getCode(result);
  }
}