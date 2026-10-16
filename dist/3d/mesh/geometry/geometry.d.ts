import type { Render3DPass } from "../../../pass/render_3d_pass";
import type { WebGPUBuffer } from "../../../types/resource";
import type { Vertex } from "../unit/vertex";
export declare class Geometry {
    private _vertex;
    indexs: number[];
    indexBuffer: WebGPUBuffer;
    vertexBuffer: WebGPUBuffer;
    render3DPass: Render3DPass;
    device: GPUDevice;
    constructor(render3DPass: Render3DPass, vertex: Vertex[], indexs: number[]);
    updateVertexBuffer(): {
        buffer: GPUBuffer;
    };
    updateIndexBuffer(): {
        buffer: GPUBuffer;
    };
    pushVertex(vertex: Vertex): void;
    popVertex(): void;
    get vertex(): Vertex[];
    set vertex(value: Vertex[]);
}
//# sourceMappingURL=geometry.d.ts.map