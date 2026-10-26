import { Vector4 } from "../math/vector";
import { Light } from "./light";
export class PointLight extends Light {
    position;
    constructor({ position = new Vector4(0, 0, 0, 1), ...rest } = {}) {
        super(rest);
        this.position = position;
    }
}
//# sourceMappingURL=point_light.js.map