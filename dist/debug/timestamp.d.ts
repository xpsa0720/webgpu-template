export interface TimestampQuery {
    querySet: GPUQuerySet;
    resolveBuffer: GPUBuffer;
    stagingBuffer: GPUBuffer;
    count: number;
}
export declare function createTimestampQuery(device: GPUDevice, count: number): TimestampQuery;
export declare function resolveTimestampQuery(encoder: GPUCommandEncoder, query: TimestampQuery): void;
export declare function readTimestampLines(query: TimestampQuery, labels: string[]): Promise<string[]>;
//# sourceMappingURL=timestamp.d.ts.map