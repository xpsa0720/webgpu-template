import { Vector4 } from "../math/vector";
export class Light {
    intensity;
    color;
    constructor({ intensity = 1, color = new Vector4(1, 1, 1, 1) } = {}) {
        this.intensity = intensity;
        this.color = color;
    }
}
//# sourceMappingURL=light.js.map