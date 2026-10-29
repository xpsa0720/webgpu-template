import { SHADER_POINT_LIGHT_PV_MATRIX, SHADER_POINT_SHADOW_TEXTURE, } from "../code/shader_code";
import { ShaderLightGadget, } from "./shader_light_gadget";
export class ShaderPointLightGadget extends ShaderLightGadget {
    shadowPvMatrixDefine;
    shadowTextureDefine;
    shadowAddFunc;
    shadowAddCode;
    instanceShadowAddCode;
    instanceShadowAddFunc;
    constructor(params) {
        super({
            ...params,
            placeholder: {
                ...params.placeholder,
                "@POINT_LIGHT_COMPARE_CODE": "",
                "@POINT_SHADOW_VISIBILTY_FUNC_CODE": "",
            },
        });
        this.shadowPvMatrixDefine = SHADER_POINT_LIGHT_PV_MATRIX;
        this.shadowTextureDefine = SHADER_POINT_SHADOW_TEXTURE;
        this.shadowAddFunc = params.shadowAddFunc;
        this.shadowAddCode = params.shadowAddCode;
        this.instanceShadowAddCode = params.instanceShadowAddCode;
        this.instanceShadowAddFunc = params.instanceShadowAddFunc;
    }
    get hasShadow() {
        return this.lights.some((l) => l.castShadow);
    }
    // 그림자 비교 / visibility 코드 placeholder를 hasShadow에 맞춰 채우거나 비운다
    syncShadowPlaceholder(instance = false) {
        this.placeholder["@POINT_LIGHT_COMPARE_CODE"] = instance ? this.getInstanceShadowAddCode() : this.getShadowAddCode();
        this.placeholder["@POINT_SHADOW_VISIBILTY_FUNC_CODE"] = instance ? this.getInstanceShadowAddFuncCode() : this.getShadowAddFuncCode();
    }
    getCode(instance = false) {
        this.syncShadowPlaceholder(instance);
        return super.getCode();
    }
    getFunctionCode(instance = false) {
        this.syncShadowPlaceholder(instance);
        return super.getFunctionCode();
    }
    getShadowDefinesCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
    }
    getShadowAddCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddCode;
    }
    getShadowAddFuncCode() {
        if (!this.hasShadow)
            return "";
        return this.shadowAddFunc;
    }
    getInstanceShadowAddCode() {
        if (!this.hasShadow)
            return "";
        return this.instanceShadowAddCode;
    }
    getInstanceShadowAddFuncCode() {
        if (!this.hasShadow)
            return "";
        return this.instanceShadowAddFunc;
    }
}
//# sourceMappingURL=shader_point_light_gadget.js.map