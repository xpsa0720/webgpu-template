export const SHADER_MATRIX_STRUCT =`
struct Matrixs{
  mvpMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>
}`;

export const SHADER_VERTEXOUT_STRUCT =
`
struct VertexOut{
  @builtin(position) position:vec4f,
  @location(0) normal:vec4f,
  @location(1) color:vec4f,
  @location(2) world_position:vec4f,
}`