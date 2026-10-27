import { SHADER_MATRIAL_STRUCT, SHADER_MESH_MATRIX_STRUCT, } from "../../shader/gadget/code/shader_code";
import { wgslStructSize } from "../../util/math";
import { createModelMatrix, createModelMatrixData, createNormalMatrix, } from "../../util/matrix";
import { Vector3 } from "../math/vector";
export class Node {
    render3DPass;
    _location;
    _rotate;
    _scale;
    worldMat;
    normalMat;
    // location / rotate / scale이 바뀌면 true. 렌더러가 프레임마다 확인해서 updateWorld()로 반영
    dirty = true;
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
        const device = render3DPass.device;
        this.matrixBuffer = {
            buffer: device.createBuffer({
                size: wgslStructSize(SHADER_MESH_MATRIX_STRUCT),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            }),
        };
        this.updateWorld();
    }
    get location() {
        return this._location;
    }
    set location(value) {
        this._location = this.watch(value);
        this.dirty = true;
    }
    get rotate() {
        return this._rotate;
    }
    set rotate(value) {
        this._rotate = this.watch(value);
        this.dirty = true;
    }
    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale = this.watch(value);
        this.dirty = true;
    }
    // Vector3의 x/y/z가 바뀌면 dirty = true (node.location.x += 1, node.rotate.add(v) 등)
    watch(vector) {
        return new Proxy(vector, {
            set: (target, key, value) => {
                const result = Reflect.set(target, key, value);
                this.dirty = true;
                return result;
            },
        });
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        child.updateWorld(); // 부모가 생겼으니 자식 쪽만 즉시 다시 계산
    }
    /**
     * 월드 / normal 행렬을 다시 계산한다 (자식까지 재귀).
     * 렌더러는 dirty일 때만 호출한다. 값을 바꾼 직후 월드 행렬이 바로 필요하면 직접 호출해도 된다.
     */
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
        this.meshs.forEach((mesh) => (mesh.dirty = true)); // Mesh 행렬은 Node 행렬을 포함하므로 다시 써야 함
        this.dirty = false;
        this.children.forEach((child) => child.updateWorld()); // 부모가 바뀌면 자식 월드도 바뀜
    }
}
//# sourceMappingURL=node.js.map