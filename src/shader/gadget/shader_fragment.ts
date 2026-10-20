import {
  AMBIENT_LIGHT_CODE,
  DIRECTIONAL_LIGHT_CODE,
  POINT_LIGHT_CODE,
  SHADER_FRAGMENT_DEFAULT,
} from "../template3d";
import type { ShaderLightGadget } from "./shader_light";
import {
  ShaderAmbientLightGadget,
  ShaderDirectionalLightGadget,
  ShaderPointLightGadget,
} from "./shader_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";

export interface ShaderFragmentGadgetParams extends ShaderGadgetParams {
}

export class ShaderFragmentGadget extends ShaderGadget {
  ambientLight: ShaderAmbientLightGadget;
  pointLight: ShaderPointLightGadget;
  directionalLight: ShaderDirectionalLightGadget;

  constructor({ placeholder = {} }: ShaderFragmentGadgetParams) {
    super({ placeholder });
    this.ambientLight = AMBIENT_LIGHT_CODE;
    this.pointLight = POINT_LIGHT_CODE;
    this.directionalLight = DIRECTIONAL_LIGHT_CODE;
  }

  updatePlaceholder() {
    this.placeholder["@LIGHT_STRUCTS_UNIFORMS"] =
      this.getLightStructsUniforms();
    this.placeholder["@LIGHT_CODES"] = this.getLightCode();
    this.placeholder["@LIGHT_FUNCTIONS"] = this.getFuntionCode();
  }

  private get lights(): ShaderLightGadget<any>[] {
    return [this.ambientLight, this.pointLight, this.directionalLight];
  }

  getFuntionCode(){
    let result = "";
    this.lights.forEach((e) => {
      result += e.getFunctionCode()+"\n";
    });
    return result;
  }

  getLightStructsUniforms() {
    let result = "";
    this.lights.forEach((e) => {
      result += e.getStructUniformCode()+"\n";
    });
    return result;
  }

  getLightCode() {
    let result = "";
    this.lights.forEach((e) => {
      result += e.getCode()+"\n";
    });
    return result;
  }

  getCode() {
    let result =  SHADER_FRAGMENT_DEFAULT;
    return super.getCode(result);
  }

  getBindGroupEntry(): GPUBindGroupEntry[]{
    const result:GPUBindGroupEntry[] = []

    result.push({binding:this.pointLight.binding, resource:{buffer:this.pointLight.}})

    return result
  }
}
