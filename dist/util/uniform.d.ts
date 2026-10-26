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
export declare function uniformData<T extends object>(structCode: string, data: T): Float32Array;
export declare function uniformDataArray<T extends object>(structCode: string, dataList: readonly T[]): Float32Array;
export {};
//# sourceMappingURL=uniform.d.ts.map