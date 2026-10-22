import type { InstanceMesh } from "../../3d/mesh/instance";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
interface VertexInput {
    location: number;
    name: string;
}
export interface ShaderVertexGadgetParams extends ShaderGadgetParams {
    vertexInput?: VertexInput[];
    instanceMesh: InstanceMesh[];
}
export declare class ShaderVertexGadget extends ShaderGadget {
    vertexInput: VertexInput[];
    instanceMesh: InstanceMesh[];
    constructor({ placeholder, vertexInput, instanceMesh }: ShaderVertexGadgetParams);
    getCode(): string;
    getVertexLayout(): GPUVertexBufferLayout[];
}
export {};
//# sourceMappingURL=shader_vertex.d.ts.map