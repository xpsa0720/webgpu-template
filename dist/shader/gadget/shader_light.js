import { ShaderGadget } from "./shader_gadget";
export class ShaderLightGadget extends ShaderGadget {
    struct;
    define;
    group;
    func;
    code;
    binding;
    countPlaceholder;
    _lights;
    constructor({ struct, define, placeholder, binding, group, code, func, lights = [], countPlaceholder, }) {
        super({ placeholder });
        this.struct = struct;
        this.define = define;
        this.group = group;
        this.code = code;
        this.func = func;
        this.binding = binding;
        this._lights = [];
        this.countPlaceholder = countPlaceholder;
        if (!this.placeholder[this.countPlaceholder]) {
            throw new Error("플레이스홀더 값이 잘못 됐습니다!");
        }
        lights.forEach((l) => this.addLight(l));
    }
    get lights() {
        return this._lights;
    }
    set lights(value) {
        this._lights = value;
        this.updateCount();
    }
    addLight(light) {
        this._lights.push(light);
        this.updateCount();
    }
    removeLight(index) {
        const removed = this._lights.splice(index, 1)[0];
        this.updateCount();
        return removed;
    }
    updateCount() {
        this.placeholder[this.countPlaceholder] = String(Math.max(1, this._lights.length));
    }
    getCode() {
        return super.getCode(this.code);
    }
    getFunctionCode() {
        return super.getCode(this.func);
    }
    getStructUniformCode() {
        let result = "";
        result += this.struct + "\n";
        result += this.define + "\n";
        return super.getCode(result);
    }
}
export class ShaderAmbientLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
export class ShaderPointLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
export class ShaderDirectionalLightGadget extends ShaderLightGadget {
    constructor(params) {
        super(params);
    }
}
//# sourceMappingURL=shader_light.js.map