import { Vector3, Vector4 } from "../math/vector";
export class Light {
    // position: Vector3;
    intensity;
    color;
    constructor({ intensity, color }) {
        // this.position = position;
        this.intensity = intensity ?? 1;
        this.color = color ?? new Vector4(1, 1, 1, 1);
    }
}
//# sourceMappingURL=light.js.map