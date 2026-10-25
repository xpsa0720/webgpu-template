import { SHADER_MATRIAL_STRUCT, SHADER_MESH_MATRIX_STRUCT, } from "../../shader/gadget/code/shader_code";
import { wgslStructSize } from "../../util/math";
import { createModelMatrix, createModelMatrixData, createNormalMatrix, } from "../../util/matrix";
import { Vector3 } from "../math/vector";
export class Node {
    render3DPass;
    location;
    rotate;
    scale;
    worldMat;
    normalMat;
    parent = null;
    children = [];
    matrixBuffer;
    meshs;
    constructor({ location, rotate, scale, render3DPass, meshs }) {
        this.render3DPass = render3DPass;
        this.location = location;
        this.rotate = rotate ?? new Vector3(0);
        this.scale = scale ?? new Vector3(1, 1, 1);
        this.meshs = meshs ?? [];
        this.worldMat = createModelMatrix({
            location: this.location,
            rotate: this.rotate,
            scale: this.scale,
        });
        this.normalMat = createNormalMatrix({
            location: this.location,
            rotate: this.rotate,
            scale: this.scale,
        });
        const device = render3DPass.device;
        this.matrixBuffer = {
            buffer: device.createBuffer({
                size: wgslStructSize(SHADER_MESH_MATRIX_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.updateWorld();
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        this.updateWorld();
    }
    updateWorld() {
        const local = createModelMatrix({
            location: this.location,
            rotate: this.rotate,
            scale: this.scale,
        });
        const localNormal = createNormalMatrix({
            location: this.location,
            rotate: this.rotate,
            scale: this.scale,
        });
        this.worldMat = this.parent ? local.multiply(this.parent.worldMat) : local;
        this.normalMat = this.parent
            ? localNormal.multiply(this.parent.normalMat)
            : localNormal;
        this.meshs.forEach((mesh) => mesh.dirty = true);
        this.children.forEach((child) => child.updateWorld());
    }
}
//# sourceMappingURL=node.js.map