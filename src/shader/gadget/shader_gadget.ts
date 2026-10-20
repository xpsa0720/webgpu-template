import { applyVariableShaderCode } from "../../util/compile";

export interface ShaderGadgetParams{
  placeholder?: Record<string,string>
}

export abstract class ShaderGadget{
  placeholder: Record<string,string>
  constructor({placeholder = {}}: ShaderGadgetParams) {
    this.placeholder = placeholder;
  }

  getCode(code:string){
    return applyVariableShaderCode(code, this.placeholder);
  }
}