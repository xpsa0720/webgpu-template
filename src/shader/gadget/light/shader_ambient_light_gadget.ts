import type { AmbientLight } from "../../../3d/light/ambient_light";
import { ShaderLightGadget, type ShaderLightGadgetParams } from "./shader_light_gadget";

export class ShaderAmbientLightGadget extends ShaderLightGadget<AmbientLight> {
  constructor(params: ShaderLightGadgetParams<AmbientLight>) {
    super(params);
  }
}
