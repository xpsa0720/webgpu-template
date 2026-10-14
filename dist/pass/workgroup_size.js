const WORKGROUP_SIZE_ATTR = /@\s*workgroup_size\s*\(((?:[^()]|\([^()]*\))*)\)/g;
const AUTO_PLACEHOLDER = [/@X_AUTO\b/, /@Y_AUTO\b/, /@Z_AUTO\b/];
const DEFAULT_AUTO_WORKGROUP_SIZE = { 1: 64, 2: 8, 3: 4 };
const FALLBACK_PLACEHOLDER_SIZE = 4;
const INT_LITERAL = /^(0[xX][0-9a-fA-F]+|\d+)[iu]?$/;
export function resolveWorkgroupSize(shaderCode, entryPoint, label) {
    const attrArgs = findWorkgroupSizeArgs(shaderCode, entryPoint);
    if (!attrArgs) {
        throw new Error(`ComputePass "${label}": @workgroup_size for entry point "${entryPoint}" not found`);
    }
    const resolved = [0, 1, 2].map((axis) => resolveSize(axis, attrArgs, shaderCode, label));
    const sizes = [
        resolved[0].size,
        resolved[1].size,
        resolved[2].size,
    ];
    return {
        sizes,
        isAuto: [resolved[0].isAuto, resolved[1].isAuto, resolved[2].isAuto],
        shaderCode: applyWorkgroupSize(shaderCode, sizes, attrArgs),
    };
}
function findWorkgroupSizeArgs(shaderCode, entryPoint) {
    for (const match of shaderCode.matchAll(WORKGROUP_SIZE_ATTR)) {
        const rest = shaderCode.slice(match.index + match[0].length);
        const fnName = /\bfn\s+([A-Za-z_]\w*)/.exec(rest)?.[1];
        if (fnName !== entryPoint)
            continue;
        const args = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
        const parts = [];
        let depth = 0;
        let current = "";
        for (const ch of args) {
            if (ch === "(")
                depth++;
            if (ch === ")")
                depth--;
            if (ch === "," && depth === 0) {
                parts.push(current.trim());
                current = "";
            }
            else {
                current += ch;
            }
        }
        if (current.trim())
            parts.push(current.trim());
        return parts;
    }
    return null;
}
function resolveSize(axis, attrArgs, shaderCode, label) {
    if (attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a))) {
        return { size: DEFAULT_AUTO_WORKGROUP_SIZE[attrArgs.length], isAuto: true };
    }
    const expr = attrArgs[axis];
    if (expr === undefined)
        return { size: 0, isAuto: false };
    const value = evalIntExpr(expr, shaderCode);
    if (value === null) {
        throw new Error(`ComputePass "${label}": cannot resolve @workgroup_size ${"XYZ"[axis]} value "${expr}"; use an integer literal, a const/override initialized with one, or @${"XYZ"[axis]}_AUTO`);
    }
    return { size: value, isAuto: false };
}
function applyWorkgroupSize(shaderCode, sizes, attrArgs) {
    let code = shaderCode;
    for (let axis = 0; axis < 3; axis++) {
        const inEntry = attrArgs.some((a) => AUTO_PLACEHOLDER[axis].test(a));
        const value = inEntry ? sizes[axis] : FALLBACK_PLACEHOLDER_SIZE;
        code = code.replace(new RegExp(AUTO_PLACEHOLDER[axis].source, "g"), String(value));
    }
    return code;
}
function evalIntExpr(expr, shaderCode) {
    const literal = INT_LITERAL.exec(expr);
    if (literal)
        return Number(literal[1]);
    if (!/^[A-Za-z_]\w*$/.test(expr))
        return null;
    const decl = new RegExp(`\\b(?:const|override)\\s+${expr}\\s*(?::\\s*\\w+)?\\s*=\\s*([^;]+);`).exec(shaderCode);
    if (!decl)
        return null;
    const init = INT_LITERAL.exec(decl[1].trim());
    return init ? Number(init[1]) : null;
}
//# sourceMappingURL=workgroup_size.js.map