import { Vector4 } from "../../math/vector";
export class Specular {
    strength;
    shininess;
    color;
    constructor({ strength = 1, shininess = 2, color = new Vector4(1, 1, 1, 1), }) {
        this.strength = strength;
        this.shininess = shininess;
        this.color = color;
    }
    getSpecualrArray() {
        return [this.strength, this.shininess, 0, 0, this.color];
    }
}
//# sourceMappingURL=specular.js.map