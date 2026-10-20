import { Vector3, Vector4 } from "../math/vector";
import { Light } from "./light";
export class DirectionalLight extends Light {
    directional;
    constructor({ directional, intensity, color }) {
        super({ intensity, color });
        this.directional = directional;
    }
}
//# sourceMappingURL=directional_light.js.map