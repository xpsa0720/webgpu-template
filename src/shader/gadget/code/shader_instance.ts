
export const SHADER_INSTANCE_MATRIX_STORAGE =`@group(3) @binding(20) var<storage, read> instanceMatrix: array<Matrixs>;`
export const SHADER_INSTANCE_MATRIAL_STORAGE =`@group(3) @binding(21) var<storage, read> instanceMatrial: array<Matrial>;`
export const SHADER_BUILTIN_INPUT = `@builtin(instance_index) instance_index:u32`


export const SHADER_INSTANCE_VERTEX = `
  @vertex
  fn vs(@VERTEX_INPUT, @BUILTIN_INPUT) -> VertexOut {
  var out:VertexOut;
  var mvp = instanceMatrix[instance_index].mvpMatrix;
  var normalizeNormal = instanceMatrix[instance_index].normalMatrix;
  var color = instanceMatrial[instance_index].baseColor;
  var world_position = instanceMatrix[instance_index].modelMatrix;

    out.position = mvp * vec4f(pos,1);
    out.normal = normalize(normalizeNormal * vec4f(normal,0));;
    out.color = color;
    out.world_position = world_position * vec4f(pos,1);

  return out;
}`;
