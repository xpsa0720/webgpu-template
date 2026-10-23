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
/**
 * WGSL vertex entry point의 @location 입력으로 GPUVertexBufferLayout 을 만든다.
 * entryPoint 를 배열로 주면 각 entry의 입력을 합친 layout을 만든다.
 * 생략하면 @vertex 함수가 하나일 때만 그 함수를 쓴다.
 */
export declare function vertexLayoutFromWGSL(shaderCode: string, entryPoint?: string | string[], options?: VertexLayoutOptions): VertexLayout;
export declare function checkVertexLayout(layout: VertexLayout, shaderCode: string, entryPoint?: string): void;
export declare function roundUp(k: number, n: number): number;
//# sourceMappingURL=vertex_layout.d.ts.map