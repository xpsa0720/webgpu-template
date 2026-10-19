import { Vector3 } from "../../math/vector";
interface VertexParams {
    location: Vector3;
    normal?: Vector3;
}
export declare class Vertex {
    location: Vector3;
    normal: Vector3;
    normalUnspecified: boolean;
    constructor({ location, normal }: VertexParams);
}
export {};
//# sourceMappingURL=vertex.d.ts.map