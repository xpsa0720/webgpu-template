import { SHADER_VERTEX_DEFAULT, SHADER_VERTEX_INPUT } from "./code/shader_code";
import { ShaderGadget } from "./shader_gadget";
const SCALAR = {
    f32: { family: "float", bits: 32, suffix: "f" },
    f16: { family: "float", bits: 16, suffix: "h" },
    i32: { family: "sint", bits: 32, suffix: "i" },
    u32: { family: "uint", bits: 32, suffix: "u" },
};
/** GPUVertexFormat → { byteSize, family } */
const FORMAT_TABLE = {
    // float 계열
    float16: { byteSize: 2, family: "float" },
    float16x2: { byteSize: 4, family: "float" },
    float16x4: { byteSize: 8, family: "float" },
    float32: { byteSize: 4, family: "float" },
    float32x2: { byteSize: 8, family: "float" },
    float32x3: { byteSize: 12, family: "float" },
    float32x4: { byteSize: 16, family: "float" },
    // sint 계열
    sint8: { byteSize: 1, family: "sint" },
    sint8x2: { byteSize: 2, family: "sint" },
    sint8x4: { byteSize: 4, family: "sint" },
    sint16: { byteSize: 2, family: "sint" },
    sint16x2: { byteSize: 4, family: "sint" },
    sint16x4: { byteSize: 8, family: "sint" },
    sint32: { byteSize: 4, family: "sint" },
    sint32x2: { byteSize: 8, family: "sint" },
    sint32x3: { byteSize: 12, family: "sint" },
    sint32x4: { byteSize: 16, family: "sint" },
    // uint 계열
    uint8: { byteSize: 1, family: "uint" },
    uint8x2: { byteSize: 2, family: "uint" },
    uint8x4: { byteSize: 4, family: "uint" },
    uint16: { byteSize: 2, family: "uint" },
    uint16x2: { byteSize: 4, family: "uint" },
    uint16x4: { byteSize: 8, family: "uint" },
    uint32: { byteSize: 4, family: "uint" },
    uint32x2: { byteSize: 8, family: "uint" },
    uint32x3: { byteSize: 12, family: "uint" },
    uint32x4: { byteSize: 16, family: "uint" },
    // unorm 계열
    unorm8: { byteSize: 1, family: "float" },
    unorm8x2: { byteSize: 2, family: "float" },
    unorm8x4: { byteSize: 4, family: "float" },
    unorm16: { byteSize: 2, family: "float" },
    unorm16x2: { byteSize: 4, family: "float" },
    unorm16x4: { byteSize: 8, family: "float" },
    // snorm 계열
    snorm8: { byteSize: 1, family: "float" },
    snorm8x2: { byteSize: 2, family: "float" },
    snorm8x4: { byteSize: 4, family: "float" },
    snorm16: { byteSize: 2, family: "float" },
    snorm16x2: { byteSize: 4, family: "float" },
    snorm16x4: { byteSize: 8, family: "float" },
    // 특수 포맷
    "unorm10-10-10-2": { byteSize: 4, family: "float" },
    "snorm10-10-10-2": { byteSize: 4, family: "float" },
    "unorm8x4-bgra": { byteSize: 4, family: "float" },
};
export class ShaderVertexGadget extends ShaderGadget {
    vertexInput;
    instanceMesh;
    constructor({ placeholder = {}, vertexInput, instanceMesh }) {
        placeholder["@VERTEX_INPUT"] = SHADER_VERTEX_INPUT;
        super({ placeholder });
        this.vertexInput = vertexInput ?? [];
        this.instanceMesh = instanceMesh ?? [];
    }
    getCode() {
        let result = SHADER_VERTEX_DEFAULT;
        return super.getCode(result);
    }
    getVertexLayout() {
        const layout = {
            arrayStride: roundUp(4, FORMAT_TABLE["float32x3"].byteSize * 2),
            stepMode: "vertex",
            attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" },
            ],
        };
        return [layout];
    }
}
function roundUp(k, n) {
    return Math.ceil(n / k) * k;
}
//# sourceMappingURL=shader_vertex.js.map