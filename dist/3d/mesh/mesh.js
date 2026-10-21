import { Vector3 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
export class Mesh {
    render3DPass;
    location; // World Space 기준
    rotate; // 방향 벡터가 아닌 각 축의 각도 기준 (0~360)
    scale;
    geometry;
    matrial;
    constructor({ location, rotate, scale, geometry, render3DPass, matrial }) {
        this.render3DPass = render3DPass;
        this.location = location;
        this.geometry = geometry;
        this.matrial = matrial;
        this.rotate = rotate ?? new Vector3(0);
        this.scale = scale ?? new Vector3(1, 1, 1);
    }
}
//# sourceMappingURL=mesh.js.map