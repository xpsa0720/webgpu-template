# @xpsa0720/webgpu

A utility library for concisely setting up WebGPU render/compute pipelines.

## Installation

```bash
npm install @xpsa0720/webgpu
```

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
import { WP, ParamsBuffer, GPU_PARAMS_BYTE_SIZE } from "@xpsa0720/webgpu";
import type { WebGPUBuffer } from "@xpsa0720/webgpu";
import shaderCode from "./shader/my_shader.wgsl?raw";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const params = new ParamsBuffer();
const wp = new WP({ canvas, params });

await wp.init();

// Create buffer
const paramsBuffer = wp.createBuffer(
  GPU_PARAMS_BYTE_SIZE,
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

// Animation loop
wp.animate({ b: { params: paramsBuffer } });
```

## API

| Class / Function | Description |
|---|---|
| `WP` | Device init, buffer/texture/sampler creation, pass registration, animation loop |
| `ParamsBuffer` | Manages GPU uniform buffer and CPU-side settings together |
| `RenderPass` | Render pipeline wrapper |
| `ComputePass` | Compute pipeline wrapper |
| `Position` | Mouse/touch input utility |
| `loadImageBitmap` | Load image URL → `ImageBitmap` |

## Example

The `example/` directory contains a fullscreen gradient demo.

```bash
# 1. Install root dependencies and build the library
npm install
npm run build

# 2. Run the example
cd example
npm install
npm run dev
```

Open the browser to see a time-varying gradient.

## Development

```bash
# Build the library
npm run build
```

Outputs ESM + type declarations from `src/` to `dist/` using `tsconfig.build.json`.

## License

MIT
