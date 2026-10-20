import { Light } from "./light";
export class PointLight extends Light {
    position;
    constructor({ position, intensity, color }) {
        super({ intensity, color });
        this.position = position;
    }
}
//# sourceMappingURL=point_light.js.map