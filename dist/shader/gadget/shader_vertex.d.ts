import type { InstanceMesh } from "../../3d/node/mesh/instance";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
type TypeFamily = "float" | "sint" | "uint";
/** GPUVertexFormat → { byteSize, family } */
export declare const FORMAT_TABLE: Record<string, {
    byteSize: number;
    family: TypeFamily;
}>;
interface VertexInput {
    location: number;
    name: string;
}
export interface ShaderVertexGadgetParams extends ShaderGadgetParams {
    device: GPUDevice;
    vertexInput?: VertexInput[];
    instanceMesh?: InstanceMesh[];
    code?: string;
}
export declare class ShaderVertexGadget extends ShaderGadget {
    device: GPUDevice;
    vertexInput: VertexInput[];
    instanceMesh: InstanceMesh[];
    code: string;
    constructor({ placeholder, device, vertexInput, instanceMesh, code, }: ShaderVertexGadgetParams);
    getCode(): string;
    getVertexLayout(): GPUVertexBufferLayout[];
}
export {};
//# sourceMappingURL=shader_vertex.d.ts.map