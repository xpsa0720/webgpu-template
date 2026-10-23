import { SHADER_MATRIAL_STRUCT, SHADER_MATRIX_STRUCT, } from "../../shader/gadget/code/shader_code";
import { distance, wgslStructSize } from "../../util/math";
import { Vector3 } from "../math/vector";
import { Geometry } from "./geometry/geometry";
export class Mesh {
    render3DPass;
    location; // World Space 기준
    rotate; // 방향 벡터가 아닌 각 축의 각도 기준 (0~360)
    scale;
    geometry;
    matrial;
    matrixBuffer;
    matrialBuffer;
    cachedBindGroup = null;
    AabbCenter;
    AabbRadius;
    constructor({ location, rotate, scale, geometry, render3DPass, matrial, }) {
        this.render3DPass = render3DPass;
        this.location = location;
        this.geometry = geometry;
        this.matrial = matrial;
        this.rotate = rotate ?? new Vector3(0);
        this.scale = scale ?? new Vector3(1, 1, 1);
        this.AABB();
        const device = render3DPass.device;
        this.matrixBuffer = {
            buffer: device.createBuffer({
                size: wgslStructSize(SHADER_MATRIX_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.matrialBuffer = {
            buffer: device.createBuffer({
                size: wgslStructSize(SHADER_MATRIAL_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
    }
    AABB() {
        let min = new Vector3(Infinity, Infinity, Infinity);
        let max = new Vector3(-Infinity, -Infinity, -Infinity);
        let maxDistance = -Infinity;
        this.geometry.vertex.forEach((e) => {
            min = Vector3.min(min, e.location);
            max = Vector3.max(max, e.location);
        });
        this.AabbCenter = new Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
        this.geometry.vertex.forEach((e) => {
            const d = distance(e.location, this.AabbCenter);
            maxDistance = Math.max(maxDistance, d);
        });
        this.AabbRadius = maxDistance;
    }
}
//# sourceMappingURL=mesh.js.map