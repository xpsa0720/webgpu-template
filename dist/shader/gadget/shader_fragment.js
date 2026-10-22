import { ShaderAmbientLightGadget, ShaderDirectionalLightGadget, ShaderPointLightGadget, } from "./shader_light";
import { ShaderGadget } from "./shader_gadget";
import { AMBIENT_LIGHT, DIRECTIONAL_LIGHT, POINT_LIGHT, SHADER_FRAGMENT_DEFAULT } from "./code/shader_code";
export class ShaderFragmentGadget extends ShaderGadget {
    device;
    shaderLights;
    onLightChange;
    constructor({ placeholder = {}, device, onLightChange }) {
        super({ placeholder });
        this.device = device;
        this.onLightChange = onLightChange;
        this.shaderLights = this.initLight();
        this.updatePlaceholder();
    }
    wrapLightChange() {
        return () => {
            this.updatePlaceholder();
            this.onLightChange?.();
        };
    }
    initLight() {
        const result = {};
        const usedBindings = new Set();
        const LIGHT_CODE_LIST = [
            new ShaderPointLightGadget({
                struct: POINT_LIGHT.struct,
                define: POINT_LIGHT.define,
                countPlaceholder: POINT_LIGHT.countPlaceholder,
                group: 3,
                binding: 10,
                code: POINT_LIGHT.code,
                func: POINT_LIGHT.func,
                device: this.device,
                onLightChange: this.wrapLightChange(),
            }),
            new ShaderAmbientLightGadget({
                struct: AMBIENT_LIGHT.struct,
                define: AMBIENT_LIGHT.define,
                countPlaceholder: AMBIENT_LIGHT.countPlaceholder,
                group: 3,
                binding: 11,
                code: AMBIENT_LIGHT.code,
                func: AMBIENT_LIGHT.func,
                device: this.device,
                onLightChange: this.wrapLightChange(),
            }),
            new ShaderDirectionalLightGadget({
                struct: DIRECTIONAL_LIGHT.struct,
                define: DIRECTIONAL_LIGHT.define,
                countPlaceholder: DIRECTIONAL_LIGHT.countPlaceholder,
                group: 3,
                binding: 12,
                code: DIRECTIONAL_LIGHT.code,
                func: DIRECTIONAL_LIGHT.func,
                device: this.device,
                onLightChange: this.wrapLightChange(),
            }),
        ];
        LIGHT_CODE_LIST.forEach((e, i) => {
            if (usedBindings.has(e.binding)) {
                throw new Error(`Light binding 번호 ${e.binding}이 중복됨`);
            }
            usedBindings.add(e.binding);
            result[i] = e;
        });
        return result;
    }
    updatePlaceholder() {
        this.placeholder["@LIGHT_STRUCTS_UNIFORMS"] =
            this.getLightStructsUniforms();
        this.placeholder["@LIGHT_CODES"] = this.getLightCode();
        this.placeholder["@LIGHT_FUNCTIONS"] = this.getFuntionCode();
    }
    get lights() {
        return Object.values(this.shaderLights).sort((a, b) => a.binding - b.binding);
    }
    getFuntionCode() {
        let result = "";
        this.lights.forEach((e) => {
            result += e.getFunctionCode() + "\n";
        });
        return result;
    }
    getLightStructsUniforms() {
        let result = "";
        this.lights.forEach((e) => {
            result += e.getStructUniformCode() + "\n";
        });
        return result;
    }
    getLightCode() {
        let result = "";
        this.lights.forEach((e) => {
            result += e.getCode() + "\n";
        });
        return result;
    }
    getCode() {
        let result = SHADER_FRAGMENT_DEFAULT;
        return super.getCode(result);
    }
    getBindGroupEntry() {
        const result = [];
        this.lights.forEach((e) => {
            if (e.lights.length === 0)
                return;
            result.push({ binding: e.binding, resource: { buffer: e.gpuBuffer.buffer } });
        });
        return result;
    }
}
//# sourceMappingURL=shader_fragment.js.map