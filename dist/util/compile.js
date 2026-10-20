export function applyVariableShaderCode(shaderCode, variable) {
    let code = shaderCode;
    if (variable) {
        for (const [key, value] of Object.entries(variable)) {
            code = code.replaceAll(key, value);
        }
    }
    return code;
}
//# sourceMappingURL=compile.js.map