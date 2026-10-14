export type AxisFlags = [boolean, boolean, boolean];
export interface ResolvedWorkgroupSize {
    sizes: [number, number, number];
    isAuto: AxisFlags;
    shaderCode: string;
}
export declare function resolveWorkgroupSize(shaderCode: string, entryPoint: string, label: string): ResolvedWorkgroupSize;
//# sourceMappingURL=workgroup_size.d.ts.map