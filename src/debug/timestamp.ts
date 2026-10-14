export interface TimestampQuery {
  querySet: GPUQuerySet;
  resolveBuffer: GPUBuffer;
  stagingBuffer: GPUBuffer;
  count: number;
}

export function createTimestampQuery(
  device: GPUDevice,
  count: number,
): TimestampQuery {
  return {
    querySet: device.createQuerySet({ type: "timestamp", count }),
    resolveBuffer: device.createBuffer({
      size: count * 8,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.QUERY_RESOLVE,
    }),
    stagingBuffer: device.createBuffer({
      size: count * 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    }),
    count,
  };
}

export function resolveTimestampQuery(
  encoder: GPUCommandEncoder,
  query: TimestampQuery,
) {
  encoder.resolveQuerySet(query.querySet, 0, query.count, query.resolveBuffer, 0);
  encoder.copyBufferToBuffer(
    query.resolveBuffer,
    0,
    query.stagingBuffer,
    0,
    query.resolveBuffer.size,
  );
}

// Call after the encoder that resolved `query` has been submitted.
export async function readTimestampLines(
  query: TimestampQuery,
  labels: string[],
): Promise<string[]> {
  await query.stagingBuffer.mapAsync(GPUMapMode.READ);
  const times = new BigUint64Array(query.stagingBuffer.getMappedRange());
  const lines: string[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    const begin = times[i * 2];
    const end = times[i * 2 + 1];
    const label = labels[i];
    lines.push(
      `${label ?? `debug${i / 2}`}: ${(Number(end - begin) / 1_000_000).toFixed(3)}ms`,
    );
  }
  query.stagingBuffer.unmap();
  return lines;
}
