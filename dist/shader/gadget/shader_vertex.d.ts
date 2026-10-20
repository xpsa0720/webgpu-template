import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
interface VertexInput {
    location: number;
    name: string;
}
export interface ShaderVertexGadgetParams extends ShaderGadgetParams {
    vertexInput?: VertexInput[];
}
export declare class ShaderVertexGadget extends ShaderGadget {
    vertexInput: VertexInput[];
    constructor({ placeholder, vertexInput }: ShaderVertexGadgetParams);
    getCode(): string;
    getVertexLayout(): GPUVertexBufferLayout[];
}
export {};
//# sourceMappingURL=shader_vertex.d.ts.map