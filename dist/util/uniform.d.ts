interface StructMemberInfo {
    name: string;
    type: string;
    /** Float32Array 내 시작 인덱스 (바이트 offset / 4) */
    floatOffset: number;
    /** 이 멤버가 차지하는 float 개수 */
    floatCount: number;
}
export interface StructLayout {
    /** struct 전체 바이트 크기 (alignment 반영) */
    size: number;
    /** Float32Array 전체 길이 */
    floatLength: number;
    members: StructMemberInfo[];
}
/**
 * WGSL struct 문자열을 파싱해서 각 멤버의 offset 정보를 반환한다.
 */
export declare function parseStructLayout(structCode: string): StructLayout;
/**
 * WGSL struct 문자열과 데이터 객체로부터 정렬된 Float32Array를 생성한다.
 * 데이터 객체의 프로퍼티 이름이 struct 멤버 이름과 일치해야 한다.
 *
 * @example
 * uniformData(
 *   `struct PointLight{ position: vec4f, intensity: f32, color: vec4f }`,
 *   { position: new Vector4(1,2,3,1), intensity: 0.5, color: new Vector4(1,0,0,1) }
 * )
 * // → Float32Array [1,2,3,1, 0.5,0,0,0, 1,0,0,1]
 */
export declare function uniformData<T extends object>(structCode: string, data: T): Float32Array;
/**
 * 여러 개의 데이터 객체를 하나의 Float32Array로 합친다 (uniform array 용).
 *
 * @example
 * uniformDataArray(structCode, [light1, light2])
 */
export declare function uniformDataArray<T extends object>(structCode: string, dataList: readonly T[]): Float32Array;
export {};
//# sourceMappingURL=uniform.d.ts.map