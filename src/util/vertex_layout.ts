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
}

const SCALAR: Record<string, { family: TypeFamily; bits: number; suffix: string }> = {
  f32: { family: "float", bits: 32, suffix: "f" },
  f16: { family: "float", bits: 16, suffix: "h" },
  i32: { family: "sint", bits: 32, suffix: "i" },
  u32: { family: "uint", bits: 32, suffix: "u" },
};
const FORMAT_PREFIX: Record<string, TypeFamily> = {
  float: "float",
  unorm: "float",
  snorm: "float",
  sint: "sint",
  uint: "uint",
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

  const formats = options.formats ?? {};
  for (const name of Object.keys(formats)) {
    if (!byName.has(name)) throw new Error(`${label}: formats의 "${name}"은 셰이더 입력에 없음`);
  }

  const specs: VertexBufferSpec[] = options.buffers ?? [
    { attributes: [...inputs].sort((a, b) => a.location - b.location).map((i) => i.name) },
  ];
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  if (specs.length > limits.maxVertexBuffers) {
    throw new Error(`${label}: 버퍼 ${specs.length}개 > maxVertexBuffers(${limits.maxVertexBuffers})`);
  }
  if (inputs.length > limits.maxVertexAttributes) {
    throw new Error(`${label}: attribute ${inputs.length}개 > maxVertexAttributes(${limits.maxVertexAttributes})`);
  }

  const attributes: Record<string, VertexAttributeInfo> = {};
  const buffers = specs.map((spec, bufferIdx): GPUVertexBufferLayout => {
    if (spec.attributes.length === 0) throw new Error(`${label}: 버퍼 ${bufferIdx}의 attributes가 비어 있음`);
    let offset = 0;
    const gpuAttributes = spec.attributes.map((name): GPUVertexAttribute => {
      const input = byName.get(name);
      if (!input) throw new Error(`${label}: 버퍼 ${bufferIdx}의 "${name}"은 셰이더 입력에 없음`);
      if (attributes[name]) throw new Error(`${label}: "${name}"이 여러 버퍼에 지정됨`);

      const format = formats[name] ?? input.shaderType.defaultFormat;
      if (!format) {
        throw new Error(`${label}: ${name}: ${input.type}에 대응하는 기본 format이 없음, formats로 지정할 것`);
      }
      checkFamily(input, format, label);
      const size = formatByteSize(format, label);
      offset = roundUp(Math.min(4, size), offset);
      attributes[name] = { name, location: input.location, buffer: bufferIdx, offset, format };
      const attr = { shaderLocation: input.location, offset, format };
      offset += size;
      return attr;
    });

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

/**
 * entryPoint의 @location 입력을 layout이 모두 제공하는지 확인한다.
 * layout에 남는 attribute는 허용 (WebGPU도 허용함).
 */
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
      const input = toInput(attrs, name, type, label);
      if (input) inputs.push(input);
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
    const input = toInput(attrs, name, type, label);
    if (input) inputs.push(input);
  }
  return inputs;
}

function toInput(
  attrs: { name: string; args: string }[],
  name: string,
  type: string,
  label: string,
): VertexInput | null {
  if (attrs.some((a) => a.name === "builtin")) return null;
  const location = attrs.find((a) => a.name === "location");
  if (!location) throw new Error(`${label}: ${name}에 @location이 없음`);
  const literal = INT_LITERAL.exec(location.args.trim());
  if (!literal) {
    throw new Error(`${label}: ${name}의 @location(${location.args.trim()})은 지원하지 않음, 정수 리터럴만 가능`);
  }
  const shaderType = resolveShaderType(type);
  if (!shaderType) throw new Error(`${label}: ${name}의 타입 "${type}"은 지원하지 않음`);
  return { name, location: Number(literal[1]), type, shaderType };
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
  return { attrs, name: m[1], type: m[2].replace(/\s+/g, "") };
}

function resolveShaderType(type: string): ShaderType | null {
  const scalar = SCALAR[type];
  if (scalar) return { family: scalar.family, defaultFormat: vertexFormat(scalar.family, scalar.bits, 1) };

  const vec =
    /^vec([234])<(f32|f16|i32|u32)>$/.exec(type) ??
    /^vec([234])([fhiu])$/.exec(type);
  if (!vec) return null;
  const s = SCALAR[vec[2]] ?? Object.values(SCALAR).find((v) => v.suffix === vec[2])!;
  return { family: s.family, defaultFormat: vertexFormat(s.family, s.bits, Number(vec[1])) };
}

function vertexFormat(family: TypeFamily, bits: number, count: number): GPUVertexFormat | null {
  // 16비트 3성분 format은 존재하지 않음
  if (bits === 16 && count === 3) return null;
  return `${family}${bits}${count > 1 ? `x${count}` : ""}` as GPUVertexFormat;
}

function checkFamily(input: VertexInput, format: GPUVertexFormat, label: string) {
  const formatFamily = FORMAT_PREFIX[/^[a-z]+/.exec(format)?.[0] ?? ""];
  if (formatFamily !== input.shaderType.family) {
    throw new Error(`${label}: ${input.name}의 타입(${input.type})과 format(${format}) 계열이 다름`);
  }
}

function formatByteSize(format: GPUVertexFormat, label: string): number {
  if (["unorm10-10-10-2", "snorm10-10-10-2", "unorm8x4-bgra"].includes(format)) return 4;
  const m = /^[a-z]+(8|16|32)(?:x([234]))?$/.exec(format);
  if (!m) throw new Error(`${label}: 알 수 없는 format "${format}"`);
  return (Number(m[1]) / 8) * Number(m[2] ?? 1);
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

function roundUp(k: number, n: number): number {
  return Math.ceil(n / k) * k;
}
