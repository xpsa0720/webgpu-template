export function applyVariableShaderCode(
  shaderCode: string,
  variable?: Record<string, string>,
) {
  let code = shaderCode;
  if (variable) {
    for (const [key, value] of Object.entries(variable)) {
      code = code.replaceAll(key, value);
    }
  }
  return code;
}