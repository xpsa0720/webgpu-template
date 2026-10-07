# @xpsa0720/webgpu

A utility library for concisely setting up WebGPU render/compute pipelines.

## Installation

```bash
npm install @xpsa0720/webgpu
```

`@webgpu/types` is installed as a dependency and referenced from the package's type declarations, so WebGPU globals (`GPUDevice`, `GPUBufferUsage`, ...) are typed as soon as you import the library — no need to add it to your `tsconfig.json` `types`.

For local development, you can also use a `file:` reference:

```json
{
  "dependencies": {
    "@xpsa0720/webgpu": "file:../webgpu-template"
  }
}
```

## Quick Start

```ts
import { WP, ParamsBuffer, GPUSetting } from "@xpsa0720/webgpu";
import shaderCode from "./shader/my_shader.wgsl?raw";

// Define the uniform layout (must match the WGSL struct, BYTE_SIZE multiple of 16)
class MyGPUSetting extends GPUSetting {
  static BYTE_SIZE = 16;
  get time() { return this.f32[0]; }
  set time(v: number) { this.f32[0] = v; }
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const params = new ParamsBuffer({ gpu: MyGPUSetting }); // params.gpu.time is typed
const wp = new WP({ canvas, config: { subSteps: 1, playSpeed: 1 } }); // wp.config.* is mutable at runtime

await wp.init();

// Create buffer
const paramsBuffer = wp.createBuffer(
  params.byteSize,
  params.data,
  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
);

// Register render pass
const pass = wp.createRenderPass(0, {
  target: canvas,
  shaderCode,
  vertexEntryPoint: "vs",
  fragmentEntryPoint: "fs",
  vertexCount: 3,
  instanceCount: 1,
});

pass.writeBuffer([
  { bindigIdx: 0, bufferObj: paramsBuffer, label: "params" },
]);

// Animation loop — callBack runs once per frame after the passes
const startTime = performance.now();
wp.animate({
  b: { params: paramsBuffer },
  callBack: ({ device, gpuBuffers }) => {
    params.gpu.time = (performance.now() - startTime) / 1000;
    device.queue.writeBuffer(gpuBuffers.params.buffer, 0, params.data);
  },
});
```

## API

| Class / Function | Description |
|---|---|
| `WP` | Device init, buffer/texture/sampler creation, pass registration, animation loop |
| `ParamsBuffer<G, C>` | Manages GPU uniform buffer and CPU-side settings together. `G` extends `GPUSetting` (required, no default fields), `C` extends `CPUSetting` |
| `RenderPass` | Render pipeline wrapper |
| `ComputePass` | Compute pipeline wrapper |
| `Position` | Mouse/touch input utility |
| `loadImageBitmap` | Load image URL → `ImageBitmap` |

## Example

The `example/` directory contains an animated metaball demo: a 1D compute pass (`@workgroup_size(WG)` read from a `const`), a 2D compute pass using `@X_AUTO`/`@Y_AUTO` auto-tuning placeholders, and a render pass that displays the result.

```bash
# 1. Install root dependencies and build the library
npm install
npm run build

# 2. Run the example
cd example
npm install
npm run dev
```

Open the browser to see the metaballs move; the resolved workgroup sizes of each compute pass are logged to the console.

## Development

```bash
# Build the library
npm run build
```

Outputs ESM + type declarations from `src/` to `dist/` using `tsconfig.build.json`.

## License

MIT
