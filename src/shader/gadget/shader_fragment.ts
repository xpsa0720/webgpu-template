import type { ShaderLightGadget } from "./shader_light";
import {
  ShaderAmbientLightGadget,
  ShaderDirectionalLightGadget,
  ShaderPointLightGadget,
} from "./shader_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
import {
  AMBIENT_LIGHT,
  DIRECTIONAL_LIGHT,
  POINT_LIGHT,
  SHADER_FRAGMENT_DEFAULT,
} from "./code/shader_code";

export interface ShaderFragmentGadgetParams extends ShaderGadgetParams {
  device: GPUDevice;
  code?: string;
}

export class ShaderFragmentGadget extends ShaderGadget {
  device: GPUDevice;
  code: string;
  constructor({ placeholder = {}, device, code }: ShaderFragmentGadgetParams) {
    super({ placeholder });
    this.device = device;
    this.code = code ?? SHADER_FRAGMENT_DEFAULT;
    // this.updatePlaceholder();
    // this.updateBindGroupEntray();
  }

  // private wrapLightChange(): () => void {
  //   return () => {
  //     // this.updatePlaceholder();
  //     this.onLightChange?.();
  //   // this.updateBindGroupEntray();
  //   };
  // }

  buildCode(arg: {
    lightStructsUniforms: string;
    lightCode: string;
    funtionCode: string;
  }) {
    this.placeholder["@LIGHT_STRUCTS_UNIFORMS"] = arg.lightStructsUniforms;
    this.placeholder["@LIGHT_CODES"] = arg.lightCode;
    this.placeholder["@LIGHT_FUNCTIONS"] = arg.funtionCode;
    let result = this.code;
    return super.getCode(result);
  }
}
