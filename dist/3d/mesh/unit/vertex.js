import { Vector2, Vector3 } from "../../math/vector";
export class Vertex {
    location;
    normal;
    uv;
    normalUnspecified;
    constructor({ location, normal, uv }) {
        this.location = location;
        this.normal = normal ?? new Vector3(0, 0, 0);
        this.normalUnspecified = normal ? false : true;
        this.uv = uv ?? new Vector2(0, 0);
    }
}
//# sourceMappingURL=vertex.js.map