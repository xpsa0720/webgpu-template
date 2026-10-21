export declare const SHADER_MATRIX_STRUCT = "\nstruct Matrixs{\n  mvpMatrix: mat4x4<f32>,\n  normalMatrix: mat4x4<f32>,\n  modelMatrix: mat4x4<f32>\n}";
export declare const SHADER_VERTEXOUT_STRUCT = "\nstruct VertexOut{\n  @builtin(position) position:vec4f,\n  @location(0) normal:vec4f,\n  @location(1) color:vec4f,\n  @location(2) world_position:vec4f,\n}";
//# sourceMappingURL=structs.d.ts.map