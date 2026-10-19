import { Vector3 } from "../../math/vector";
export class Vertex {
    location;
    normal;
    normalUnspecified;
    constructor({ location, normal }) {
        this.location = location;
        this.normal = normal ?? new Vector3(0, 0, 0);
        this.normalUnspecified = normal ? false : true;
    }
}
//# sourceMappingURL=vertex.js.map