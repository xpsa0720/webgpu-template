import { Vector4 } from "../math/vector";
import { Light } from "./light";
export class DirectionalLight extends Light {
    directional;
    constructor({ directional = new Vector4(0, -1, 0, 0), ...rest } = {}) {
        super(rest);
        this.directional = directional;
    }
}
//# sourceMappingURL=directional_light.js.map