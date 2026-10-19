export class Geometry {
    _vertex;
    indexs;
    indexBuffer;
    vertexBuffer;
    render3DPass;
    device;
    constructor(render3DPass, vertex, indexs) {
        this.render3DPass = render3DPass;
        this.device = this.render3DPass.device;
        this._vertex = vertex;
        this.indexs = indexs;
        this.vertexNormalize();
        this.vertexBuffer = this.updateVertexBuffer();
        this.indexBuffer = this.updateIndexBuffer();
    }
    vertexNormalize() {
        for (let i = 0; i < this.indexs.length; i += 3) {
            const A = this._vertex[this.indexs[i]];
            const B = this._vertex[this.indexs[i + 1]];
            const C = this._vertex[this.indexs[i + 2]];
            const BA = B.location.copy().subtract(A.location);
            const CA = C.location.copy().subtract(A.location);
            const normal = BA.crossProduct(CA);
            this._vertex[this.indexs[i]].normal = A.normalUnspecified ? normal : A.normal;
            this._vertex[this.indexs[i + 1]].normal = B.normalUnspecified ? normal : B.normal;
            this._vertex[this.indexs[i + 2]].normal = C.normalUnspecified ? normal : C.normal;
            this._vertex[this.indexs[i]].normalUnspecified = false;
            this._vertex[this.indexs[i + 1]].normalUnspecified = false;
            this._vertex[this.indexs[i + 2]].normalUnspecified = false;
        }
    }
    updateVertexBuffer() {
        const buffer = {
            buffer: this.device.createBuffer({
                size: this._vertex.length * 6 * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            }),
        };
        const data = new Float32Array(this._vertex.length * 6);
        this._vertex.forEach((vertex, i) => {
            const idx = i * 6;
            data[idx] = vertex.location.x;
            data[idx + 1] = vertex.location.y;
            data[idx + 2] = vertex.location.z;
            data[idx + 3] = vertex.normal.x;
            data[idx + 4] = vertex.normal.y;
            data[idx + 5] = vertex.normal.z;
        });
        this.device.queue.writeBuffer(buffer.buffer, 0, data);
        return buffer;
    }
    updateIndexBuffer() {
        const buffer = {
            buffer: this.device.createBuffer({
                size: Math.ceil((this.indexs.length * 2) / 4) * 4,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            }),
        };
        const alignedLen = Math.ceil((this.indexs.length * 2) / 4) * 2;
        const data = new Uint16Array(alignedLen);
        this.indexs.forEach((index, i) => {
            data[i] = index;
        });
        this.device.queue.writeBuffer(buffer.buffer, 0, data);
        return buffer;
    }
    pushVertex(vertex) {
        this._vertex.push(vertex);
        this.vertexBuffer = this.updateVertexBuffer();
        this.indexs.push(this._vertex.length - 1);
        this.indexBuffer = this.updateIndexBuffer();
    }
    popVertex() {
        this._vertex.pop();
        this.vertexBuffer = this.updateVertexBuffer();
        this.indexs.pop();
        this.indexBuffer = this.updateIndexBuffer();
    }
    get vertex() {
        return this._vertex;
    }
    set vertex(value) {
        this._vertex = value;
    }
}
//# sourceMappingURL=geometry.js.map