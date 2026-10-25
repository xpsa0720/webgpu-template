import { Vector2, Vector3 } from "../../../math/vector";
interface VertexParams {
    location: Vector3;
    normal?: Vector3;
    uv?: Vector2;
}
export declare class Vertex {
    location: Vector3;
    normal: Vector3;
    uv: Vector2;
    normalUnspecified: boolean;
    constructor({ location, normal, uv }: VertexParams);
}
export {};
//# sourceMappingURL=vertex.d.ts.map