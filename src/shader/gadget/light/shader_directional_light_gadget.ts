import type { DirectionalLight } from "../../../3d/light/directional_light";
import {
  SHADER_DIRECTIONAL_LIGHT_PV_MATRIX,
  SHADER_DIRECTIONAL_SHADOW_TEXTURE,
} from "../code/shader_code";
import {
  ShaderLightGadget,
  type ShaderLightGadgetParams,
  type ShadowGadget,
  type ShadowGadgetParams,
} from "./shader_light_gadget";

export class ShaderDirectionalLightGadget extends ShaderLightGadget<DirectionalLight> implements ShadowGadget {
  shadowPvMatrixDefine: string;
  shadowTextureDefine: string;
  shadowAddFunc: string;
  shadowAddCode: string;
  instanceShadowAddCode: string;
  instanceShadowAddFunc: string;

  constructor(params: ShaderLightGadgetParams<DirectionalLight> & ShadowGadgetParams) {
    super({
      ...params,
      placeholder: {
        ...params.placeholder,
        "@DIRECTIONAL_LIGHT_COMPARE_CODE": "",
        "@DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE": "",
      },
    });
    this.shadowPvMatrixDefine = SHADER_DIRECTIONAL_LIGHT_PV_MATRIX;
    this.shadowTextureDefine = SHADER_DIRECTIONAL_SHADOW_TEXTURE;
    this.shadowAddFunc = params.shadowAddFunc;
    this.shadowAddCode = params.shadowAddCode;
    this.instanceShadowAddCode = params.instanceShadowAddCode;
    this.instanceShadowAddFunc = params.instanceShadowAddFunc;
  }

  get hasShadow() {
    return this.lights.some((l) => l.castShadow);
  }

  private syncShadowPlaceholder(instance: boolean = false) {
    this.placeholder["@DIRECTIONAL_LIGHT_COMPARE_CODE"] = instance ? this.getInstanceShadowAddCode() : this.getShadowAddCode();
    this.placeholder["@DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE"] = instance ? this.getInstanceShadowAddFuncCode() : this.getShadowAddFuncCode();
  }

  getCode(instance: boolean = false) {
    this.syncShadowPlaceholder(instance);
    return super.getCode();
  }

  getFunctionCode(instance: boolean = false) {
    this.syncShadowPlaceholder(instance);
    return super.getFunctionCode();
  }

  getShadowDefinesCode() {
    if (!this.hasShadow) return "";
    return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
  }

  getShadowAddCode() {
    if (!this.hasShadow) return "";
    return this.shadowAddCode;
  }

  getShadowAddFuncCode() {
    if (!this.hasShadow) return "";
    return this.shadowAddFunc;
  }

  getInstanceShadowAddCode() {
    if (!this.hasShadow) return "";
    return this.instanceShadowAddCode;
  }

  getInstanceShadowAddFuncCode() {
    if (!this.hasShadow) return "";
    return this.instanceShadowAddFunc;
  }
}
