import { SHADER_MATRIAL_STRUCT } from "../../../shader/gadget/code/shader_code";
import { uniformData } from "../../../util/uniform";
import { Vector4 } from "../../math/vector";
import { Specular } from "./specular";
export class Matrial {
    color;
    opacity;
    specualr;
    constructor({ color, opacity = 1, specular = new Specular({}) }) {
        this.color = color;
        this.opacity = opacity;
        this.specualr = specular;
    }
    getColor() {
        return new Vector4(this.color.x, this.color.y, this.color.z, this.opacity);
    }
    getDataArray() {
        return uniformData(SHADER_MATRIAL_STRUCT, {
            baseColor: this.getColor(),
            specualrColor: this.specualr.color,
            specualrShininess: this.specualr.shininess,
            specualrStrength: this.specualr.strength,
        });
    }
}
//# sourceMappingURL=matrial.js.map