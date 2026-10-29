export class DummyResources {
  readonly sampler: GPUSampler;
  readonly textureView: GPUTextureView;

  constructor(device: GPUDevice) {
    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const dummyTex = device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: dummyTex },
      new Uint8Array([255, 255, 255, 255]),
      { bytesPerRow: 4 },
      [1, 1, 1],
    );
    this.textureView = dummyTex.createView();
  }
}
