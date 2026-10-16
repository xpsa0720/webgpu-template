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
        this.vertexBuffer = this.updateVertexBuffer();
        this.indexBuffer = this.updateIndexBuffer();
    }
    updateVertexBuffer() {
        const buffer = {
            buffer: this.device.createBuffer({
                size: this._vertex.length * 3 * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            }),
        };
        const data = new Float32Array(this._vertex.length * 3);
        this._vertex.forEach((vertex, i) => {
            const idx = i * 3;
            data[idx] = vertex.x;
            data[idx + 1] = vertex.y;
            data[idx + 2] = vertex.z;
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