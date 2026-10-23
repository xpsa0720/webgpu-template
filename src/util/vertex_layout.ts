const COMMENT = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
const VERTEX_FN = /@\s*vertex\b[^{;]*?\bfn\s+([A-Za-z_]\w*)/g;
const IDENT = /^[A-Za-z_]\w*$/;
const INT_LITERAL = /^(0[xX][0-9a-fA-F]+|\d+)[iu]?$/;

const DEFAULT_LIMITS: VertexLayoutLimits = {
  maxVertexBuffers: 8,
  maxVertexAttributes: 16,
  maxVertexBufferArrayStride: 2048,
};

type TypeFamily = "float" | "sint" | "uint";

interface ShaderType {
  family: TypeFamily;
  defaultFormat: GPUVertexFormat | null;
  /** 행렬이면 열 수 (vec/scalar은 1) */
  columns: number;
}

const SCALAR: Record<string, { family: TypeFamily; bits: number; suffix: string }> = {
  f32: { family: "float", bits: 32, suffix: "f" },
  f16: { family: "float", bits: 16, suffix: "h" },
  i32: { family: "sint", bits: 32, suffix: "i" },
  u32: { family: "uint", bits: 32, suffix: "u" },
};

/** GPUVertexFormat → { byteSize, family } */
const FORMAT_TABLE: Record<string, { byteSize: number; family: TypeFamily }> = {
  // float 계열
  float16:     { byteSize:  2, family: "float" },
  float16x2:   { byteSize:  4, family: "float" },
  float16x4:   { byteSize:  8, family: "float" },
  float32:     { byteSize:  4, family: "float" },
  float32x2:   { byteSize:  8, family: "float" },
  float32x3:   { byteSize: 12, family: "float" },
  float32x4:   { byteSize: 16, family: "float" },
  // sint 계열
  sint8:       { byteSize:  1, family: "sint" },
  sint8x2:     { byteSize:  2, family: "sint" },
  sint8x4:     { byteSize:  4, family: "sint" },
  sint16:      { byteSize:  2, family: "sint" },
  sint16x2:    { byteSize:  4, family: "sint" },
  sint16x4:    { byteSize:  8, family: "sint" },
  sint32:      { byteSize:  4, family: "sint" },
  sint32x2:    { byteSize:  8, family: "sint" },
  sint32x3:    { byteSize: 12, family: "sint" },
  sint32x4:    { byteSize: 16, family: "sint" },
  // uint 계열
  uint8:       { byteSize:  1, family: "uint" },
  uint8x2:     { byteSize:  2, family: "uint" },
  uint8x4:     { byteSize:  4, family: "uint" },
  uint16:      { byteSize:  2, family: "uint" },
  uint16x2:    { byteSize:  4, family: "uint" },
  uint16x4:    { byteSize:  8, family: "uint" },
  uint32:      { byteSize:  4, family: "uint" },
  uint32x2:    { byteSize:  8, family: "uint" },
  uint32x3:    { byteSize: 12, family: "uint" },
  uint32x4:    { byteSize: 16, family: "uint" },
  // unorm 계열
  unorm8:      { byteSize:  1, family: "float" },
  unorm8x2:    { byteSize:  2, family: "float" },
  unorm8x4:    { byteSize:  4, family: "float" },
  unorm16:     { byteSize:  2, family: "float" },
  unorm16x2:   { byteSize:  4, family: "float" },
  unorm16x4:   { byteSize:  8, family: "float" },
  // snorm 계열
  snorm8:      { byteSize:  1, family: "float" },
  snorm8x2:    { byteSize:  2, family: "float" },
  snorm8x4:    { byteSize:  4, family: "float" },
  snorm16:     { byteSize:  2, family: "float" },
  snorm16x2:   { byteSize:  4, family: "float" },
  snorm16x4:   { byteSize:  8, family: "float" },
  // 특수 포맷
  "unorm10-10-10-2": { byteSize: 4, family: "float" },
  "snorm10-10-10-2": { byteSize: 4, family: "float" },
  "unorm8x4-bgra":   { byteSize: 4, family: "float" },
};

export interface VertexBufferSpec {
  /** 이 버퍼에 들어가는 셰이더 입력 이름. 배열 순서가 메모리 순서. */
  attributes: string[];
  stepMode?: GPUVertexStepMode;
}

export interface VertexLayoutLimits {
  maxVertexBuffers: number;
  maxVertexAttributes: number;
  maxVertexBufferArrayStride: number;
}

export interface VertexLayoutOptions {
  /** 생략하면 모든 입력을 location 순서로 버퍼 1개에 interleaved, stepMode "vertex" */
  buffers?: VertexBufferSpec[];
  /** 셰이더 타입에서 추론한 format 대신 쓸 format (입력 이름 → format) */
  formats?: Record<string, GPUVertexFormat>;
  /** device에 더 큰 limits를 요청했다면 지정. 기본값은 WebGPU 기본 limits */
  limits?: Partial<VertexLayoutLimits>;
}

export interface VertexAttributeInfo {
  name: string;
  /** 행렬에서 펼쳐진 경우 원본 이름 (예: transform_0 → transform). 아니면 name과 동일 */
  sourceName: string;
  location: number;
  buffer: number;
  offset: number;
  format: GPUVertexFormat;
}

export interface VertexLayout {
  /** 이 layout을 만든 entry point (에러 메시지용) */
  entryPoints: string[];
  /** GPUVertexState.buffers 에 그대로 전달 */
  buffers: GPUVertexBufferLayout[];
  /** 입력 이름 → 버퍼 번호/offset/format. 버퍼 데이터를 채울 때 사용 */
  attributes: Record<string, VertexAttributeInfo>;
}

interface VertexInput {
  name: string;
  location: number;
  type: string;
  shaderType: ShaderType;
  /** 행렬에서 펼쳐진 경우 원본 이름. 아니면 name과 동일 */
  sourceName: string;
}

/**
 * WGSL vertex entry point의 @location 입력으로 GPUVertexBufferLayout 을 만든다.
 * entryPoint 를 배열로 주면 각 entry의 입력을 합친 layout을 만든다.
 * 생략하면 @vertex 함수가 하나일 때만 그 함수를 쓴다.
 */
export function vertexLayoutFromWGSL(
  shaderCode: string,
  entryPoint?: string | string[],
  options: VertexLayoutOptions = {},
): VertexLayout {
  const code = shaderCode.replace(COMMENT, "");
  const entryPoints =
    entryPoint === undefined
      ? [findSingleVertexEntry(code)]
      : Array.isArray(entryPoint)
        ? entryPoint
        : [entryPoint];
  const label = `vertexLayout(${entryPoints.join(", ")})`;
  if (entryPoints.length === 0) throw new Error(`${label}: entry point가 비어 있음`);

  const inputs = mergeInputs(
    entryPoints.map((e) => ({ entry: e, inputs: parseVertexInputs(code, e) })),
    label,
  );
  const byName = new Map(inputs.map((i) => [i.name, i]));

  const bySourceName = new Map<string, VertexInput[]>();
  for (const i of inputs) {
    const group = bySourceName.get(i.sourceName);
    if (group) group.push(i);
    else bySourceName.set(i.sourceName, [i]);
  }
  const sourceNames = new Set(inputs.map((i) => i.sourceName));

  const formats = options.formats ?? {};
  for (const name of Object.keys(formats)) {
    if (!sourceNames.has(name)) {
      throw new Error(`${label}: formats의 "${name}"은 셰이더 입력에 없음`);
    }
  }

  const specs: VertexBufferSpec[] = options.buffers ?? [
    {
      attributes: [...bySourceName.entries()]
        .sort((a, b) => a[1][0].location - b[1][0].location)
        .map(([srcName]) => srcName),
    },
  ];
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  if (specs.length > limits.maxVertexBuffers) {
    throw new Error(`${label}: 버퍼 ${specs.length}개 > maxVertexBuffers(${limits.maxVertexBuffers})`);
  }
  if (inputs.length > limits.maxVertexAttributes) {
    throw new Error(`${label}: attribute ${inputs.length}개 > maxVertexAttributes(${limits.maxVertexAttributes})`);
  }

  const attributes: Record<string, VertexAttributeInfo> = {};
  const assignedSources = new Set<string>();

  const buffers = specs.map((spec, bufferIdx): GPUVertexBufferLayout => {
    if (spec.attributes.length === 0) throw new Error(`${label}: 버퍼 ${bufferIdx}의 attributes가 비어 있음`);
    let offset = 0;
    const gpuAttributes: GPUVertexAttribute[] = [];

    for (const specName of spec.attributes) {
      // 펼쳐진 이름(transform_0 등)이 아닌 원본 이름(transform)으로만 지정 가능
      if (!bySourceName.has(specName) && byName.has(specName)) {
        const input = byName.get(specName)!;
        if (input.sourceName !== input.name) {
          throw new Error(`${label}: "${specName}"은 행렬 "${input.sourceName}"에서 펼쳐진 이름임, 원본 이름 "${input.sourceName}"을 사용할 것`);
        }
      }
      const expandedInputs = bySourceName.get(specName);
      if (!expandedInputs) throw new Error(`${label}: 버퍼 ${bufferIdx}의 "${specName}"은 셰이더 입력에 없음`);

      if (assignedSources.has(specName)) throw new Error(`${label}: "${specName}"이 여러 버퍼에 지정됨`);
      assignedSources.add(specName);

      for (const input of expandedInputs) {
        if (attributes[input.name]) throw new Error(`${label}: "${input.name}"이 여러 버퍼에 지정됨`);

        const format = formats[input.sourceName] ?? input.shaderType.defaultFormat;
        if (!format) {
          throw new Error(`${label}: ${input.name}: ${input.type}에 대응하는 기본 format이 없음, formats로 지정할 것`);
        }
        checkFamily(input, format, label);
        const size = formatByteSize(format, label);
        offset = roundUp(Math.min(4, size), offset);
        attributes[input.name] = { name: input.name, sourceName: input.sourceName, location: input.location, buffer: bufferIdx, offset, format };
        gpuAttributes.push({ shaderLocation: input.location, offset, format });
        offset += size;
      }
    }

    const arrayStride = roundUp(4, offset);
    if (arrayStride > limits.maxVertexBufferArrayStride) {
      throw new Error(`${label}: 버퍼 ${bufferIdx}의 stride ${arrayStride} > maxVertexBufferArrayStride(${limits.maxVertexBufferArrayStride})`);
    }
    return { arrayStride, stepMode: spec.stepMode ?? "vertex", attributes: gpuAttributes };
  });

  const unassigned = inputs.filter((i) => !attributes[i.name]).map((i) => i.name);
  if (unassigned.length > 0) {
    throw new Error(`${label}: 어느 버퍼에도 지정되지 않은 입력: ${unassigned.join(", ")}`);
  }

  return { entryPoints, buffers, attributes };
}

export function checkVertexLayout(
  layout: VertexLayout,
  shaderCode: string,
  entryPoint?: string,
): void {
  const code = shaderCode.replace(COMMENT, "");
  const entry = entryPoint ?? findSingleVertexEntry(code);
  const label = `vertexLayout(${entry}) ← layout 출처: ${layout.entryPoints.join(", ")}`;
  const byLocation = new Map(Object.values(layout.attributes).map((a) => [a.location, a]));

  for (const input of parseVertexInputs(code, entry)) {
    const attr = byLocation.get(input.location);
    if (!attr) throw new Error(`${label}: @location(${input.location}) ${input.name}이 layout에 없음`);
    checkFamily(input, attr.format, label);
  }
}

function findSingleVertexEntry(code: string): string {
  const names = [...code.matchAll(VERTEX_FN)].map((m) => m[1]);
  if (names.length !== 1) {
    throw new Error(
      `vertexLayout: @vertex 함수가 ${names.length}개${names.length ? ` (${names.join(", ")})` : ""}, entryPoint를 지정할 것`,
    );
  }
  return names[0];
}

function parseVertexInputs(code: string, entryPoint: string): VertexInput[] {
  const label = `vertexLayout(${entryPoint})`;
  const fn = new RegExp(`\\bfn\\s+${entryPoint}\\s*\\(`).exec(code);
  if (!fn) throw new Error(`${label}: 함수 "${entryPoint}"를 찾을 수 없음`);

  const inputs: VertexInput[] = [];
  for (const param of splitTopLevel(readParenBody(code, fn.index + fn[0].length - 1))) {
    const { attrs, name, type } = parseDecl(param, label);
    if (attrs.length === 0) {
      inputs.push(...parseStructInputs(code, type, label));
    } else {
      const expanded = toInput(attrs, name, type, label);
      if (expanded) inputs.push(...expanded);
    }
  }

  const seen = new Map<number, string>();
  for (const i of inputs) {
    if (seen.has(i.location)) {
      throw new Error(`${label}: @location(${i.location})가 ${seen.get(i.location)}, ${i.name}에 중복`);
    }
    seen.set(i.location, i.name);
  }
  return inputs;
}

function parseStructInputs(code: string, structName: string, label: string): VertexInput[] {
  if (!IDENT.test(structName)) throw new Error(`${label}: 지원하지 않는 입력 타입 "${structName}"`);
  const struct = new RegExp(`\\bstruct\\s+${structName}\\s*\\{`).exec(code);
  if (!struct) throw new Error(`${label}: 입력 struct "${structName}"를 찾을 수 없음`);

  const inputs: VertexInput[] = [];
  for (const member of splitTopLevel(readBraceBody(code, struct.index + struct[0].length - 1))) {
    const { attrs, name, type } = parseDecl(member, label);
    if (attrs.length === 0) {
      throw new Error(`${label}: ${structName}.${name}에 @location/@builtin이 없음`);
    }
    const expanded = toInput(attrs, name, type, label);
    if (expanded) inputs.push(...expanded);
  }
  return inputs;
}

function toInput(
  attrs: { name: string; args: string }[],
  name: string,
  type: string,
  label: string,
): VertexInput[] | null {
  if (attrs.some((a) => a.name === "builtin")) return null;
  const location = attrs.find((a) => a.name === "location");
  if (!location) throw new Error(`${label}: ${name}에 @location이 없음`);
  const literal = INT_LITERAL.exec(location.args.trim());
  if (!literal) {
    throw new Error(`${label}: ${name}의 @location(${location.args.trim()})은 지원하지 않음, 정수 리터럴만 가능`);
  }
  const shaderType = resolveShaderType(type);
  if (!shaderType) throw new Error(`${label}: ${name}의 타입 "${type}"은 지원하지 않음`);

  const loc = Number(literal[1]);
  if (shaderType.columns === 1) {
    return [{ name, location: loc, type, shaderType, sourceName: name }];
  }

  // 행렬: 열 개수만큼 location을 소비하며 펼침
  const colType: ShaderType = { family: shaderType.family, defaultFormat: shaderType.defaultFormat, columns: 1 };
  const expanded: VertexInput[] = [];
  for (let c = 0; c < shaderType.columns; c++) {
    expanded.push({ name: `${name}_${c}`, location: loc + c, type, shaderType: colType, sourceName: name });
  }
  return expanded;
}

function parseDecl(decl: string, label: string) {
  const attrs: { name: string; args: string }[] = [];
  let rest = decl.trim();
  for (;;) {
    const attr = /^@\s*([A-Za-z_]\w*)\s*/.exec(rest);
    if (!attr) break;
    rest = rest.slice(attr[0].length);
    let args = "";
    if (rest.startsWith("(")) {
      args = readParenBody(rest, 0);
      rest = rest.slice(args.length + 2).trimStart();
    }
    attrs.push({ name: attr[1], args });
  }
  const m = /^([A-Za-z_]\w*)\s*:\s*([\s\S]+)$/.exec(rest);
  if (!m) throw new Error(`${label}: 선언 "${decl.trim()}"을 해석할 수 없음`);
  return { attrs, name: m[1], type: normalizeType(m[2].replace(/\s+/g, "")) };
}

/** WGSL 타입 약칭을 정규형으로 변환: vec3f → vec3<f32>, mat4x4h → mat4x4<f16> 등 */
function normalizeType(type: string): string {
  const SUFFIX_TO_SCALAR: Record<string, string> = { f: "f32", h: "f16", i: "i32", u: "u32" };
  // vec 약칭: vec3f → vec3<f32>
  const vec = /^(vec[234])([fhiu])$/.exec(type);
  if (vec) return `${vec[1]}<${SUFFIX_TO_SCALAR[vec[2]]}>`;
  // mat 약칭: mat4x4f → mat4x4<f32>
  const mat = /^(mat[234]x[234])([fh])$/.exec(type);
  if (mat) return `${mat[1]}<${SUFFIX_TO_SCALAR[mat[2]]}>`;
  return type;
}

function resolveShaderType(type: string): ShaderType | null {
  const scalar = SCALAR[type];
  if (scalar) return { family: scalar.family, defaultFormat: vertexFormat(scalar.family, scalar.bits, 1), columns: 1 };

  // normalizeType()에 의해 약칭은 이미 정규형으로 변환됨 (vec3f → vec3<f32>)
  const vec = /^vec([234])<(f32|f16|i32|u32)>$/.exec(type);
  if (vec) {
    const s = SCALAR[vec[2]]!;
    return { family: s.family, defaultFormat: vertexFormat(s.family, s.bits, Number(vec[1])), columns: 1 };
  }

  // 행렬: mat2x2<f32>, mat4x4<f16> 등 (WGSL 행렬은 f32/f16만 가능)
  const mat = /^mat([234])x([234])<(f32|f16)>$/.exec(type);
  if (mat) {
    const cols = Number(mat[1]);
    const rows = Number(mat[2]);
    const s = SCALAR[mat[3]]!;
    return { family: s.family, defaultFormat: vertexFormat(s.family, s.bits, rows), columns: cols };
  }

  return null;
}

function vertexFormat(family: TypeFamily, bits: number, count: number): GPUVertexFormat | null {
  const key = `${family}${bits}${count > 1 ? `x${count}` : ""}`;
  if (!(key in FORMAT_TABLE)) return null;
  return key as GPUVertexFormat;
}

function checkFamily(input: VertexInput, format: GPUVertexFormat, label: string) {
  const info = FORMAT_TABLE[format];
  if (!info) throw new Error(`${label}: 알 수 없는 format "${format}"`);
  if (info.family !== input.shaderType.family) {
    throw new Error(`${label}: ${input.name}의 타입(${input.type})과 format(${format}) 계열이 다름`);
  }
}

function formatByteSize(format: GPUVertexFormat, label: string): number {
  const info = FORMAT_TABLE[format];
  if (!info) throw new Error(`${label}: 알 수 없는 format "${format}"`);
  return info.byteSize;
}


function readParenBody(text: string, openIdx: number): string {
  return readDelimited(text, openIdx, "(", ")");
}

function readBraceBody(text: string, openIdx: number): string {
  return readDelimited(text, openIdx, "{", "}");
}

function readDelimited(text: string, openIdx: number, open: string, close: string): string {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === open) depth++;
    if (text[i] === close && --depth === 0) return text.slice(openIdx + 1, i);
  }
  throw new Error(`vertexLayout: 닫히지 않은 "${open}"`);
}

function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(" || ch === "<") depth++;
    if (ch === ")" || ch === ">") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

function mergeInputs(
  perEntry: { entry: string; inputs: VertexInput[] }[],
  label: string,
): VertexInput[] {
  const byLocation = new Map<number, { input: VertexInput; entry: string }>();
  const byName = new Map<string, { input: VertexInput; entry: string }>();
  for (const { entry, inputs } of perEntry) {
    for (const input of inputs) {
      const sameLoc = byLocation.get(input.location);
      if (sameLoc && (sameLoc.input.name !== input.name || sameLoc.input.type !== input.type)) {
        throw new Error(
          `${label}: @location(${input.location})이 ${sameLoc.entry}에서는 ${sameLoc.input.name}: ${sameLoc.input.type}, ${entry}에서는 ${input.name}: ${input.type}`,
        );
      }
      const sameName = byName.get(input.name);
      if (sameName && sameName.input.location !== input.location) {
        throw new Error(
          `${label}: ${input.name}이 ${sameName.entry}에서는 @location(${sameName.input.location}), ${entry}에서는 @location(${input.location})`,
        );
      }
      byLocation.set(input.location, { input, entry });
      byName.set(input.name, { input, entry });
    }
  }
  return [...byLocation.values()].map((v) => v.input);
}

export function roundUp(k: number, n: number): number {
  return Math.ceil(n / k) * k;
}
