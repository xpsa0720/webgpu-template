# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`tsc`, no emit) then build via Vite
- `npm run preview` — preview the production build

There is no test runner or lint config in this repo.

## What this is

A minimal, generic starting point ("template") for WebGPU projects using TypeScript + Vite, with `lil-gui` for runtime controls. It has no simulation logic of its own — `src/main.ts`, `src/setting.ts`, `src/shader_queue.ts`, and `src/lib/params_buffer.ts` all contain a small live skeleton plus large commented-out blocks showing how a previous project (a FLIP fluid simulation) used the same framework. Keep that pattern when extending the template: real, working code stays uncommented; project-specific example code that shows "how to use this file" stays commented out for reference.

## Architecture

The engine lives in `src/lib/` and is orchestrated by `App` in `src/main.ts`.

- **`WP` (`src/lib/WP.ts`)** — the WebGPU context wrapper. Owns the adapter/device/canvas context, holds ordered arrays of `computePasses` and `renderPasses`, and drives the frame loop:
  - `init()` requests the adapter/device (requires the `timestamp-query` feature).
  - `run(passes, substep, buffers, dt, substepCallback)` runs one array of passes for `substep` iterations inside a single `requestAnimationFrame`-independent call: for each substep it creates a command encoder, invokes `substepCallback` (e.g. to write per-substep GPU state or clear buffers), runs every pass's `createPass`, optionally resolves GPU timestamp queries (when `DEBUG_MODE` is on), submits the encoder, then maps and logs any buffers marked for readback.
  - `animate(arg)` is the `requestAnimationFrame` loop: it computes real `dt` from `performance.now()`, runs `computePasses` for `config.subSteps` substeps, then runs `renderPasses` once, logs FPS if enabled, and reschedules itself.
  - `createComputePass` / `createRenderPass` build `ComputePass`/`RenderPass` instances and register them by index into `computePasses`/`renderPasses`; passing a `time: { label, startIndex, endIndex }` tag wires them into the GPU timestamp-query debug system.

- **`Pass` (`src/lib/pass.ts`)** — base class for both pass types. Holds the compiled `GPUShaderModule` and a `buffers: Record<bindingIndex, PassBuffer>` map populated via `writeBuffer([{ bindigIdx, bufferObj, label, type, isPrint, print }])`. `createPass()` builds a `GPUBindGroupEntry` array from `this.buffers`, and for any buffer flagged `isPrint`, allocates a staging buffer and schedules a `copyBufferToBuffer` for CPU readback (used by `DEBUG_PRINT`/`DEBUG_MODE` in `WP.run`).
  - **`ComputePass`** (`src/lib/compute_pass.ts`) — builds a `GPUComputePipeline` (layout `"auto"`), dispatches `ceil(computeTargetCount / workgroupSize)` workgroups.
  - **`RenderPass`** (`src/lib/render_pass.ts`) — builds a `GPURenderPipeline`, configures the canvas's `GPUCanvasContext`, and draws `vertexCount` × `instanceCount`. `loadOp: "load"` enables alpha blending (for compositing over a previous pass); `loadOp: "clear"` (default) clears the canvas first.

- **`ParamsBuffer<G, C>` (`src/params_buffer.ts`)** — generic over `G extends GPUSetting` and `C extends CPUSetting`. `GPUSetting` is a base class holding `protected f32`/`u32` views over a shared `ArrayBuffer` uploaded as a uniform buffer; projects subclass it with getter/setter pairs per index and declare `static BYTE_SIZE` (required, must be a multiple of 16 — the constructor throws otherwise). The library ships no GPU fields of its own; `gpu` is a required option. `CPUSetting` is an empty base for project-specific CPU-only values. Loop settings (`subSteps`, `playSpeed`) live in `WPConfig` (`src/setting.ts`) and are mutable at runtime via `wp.config.*`; `WP` does not take `params`. Construct with `new ParamsBuffer({ gpu: MyGPUSetting, cpu: MyCPUSetting })` and size the GPU buffer with `params.byteSize`.

- **`shader_queue.ts`** — where a concrete project defines: the `AppBuffers` interface (every named `GPUBuffer` the app uses), a `PassQueue`/`PassRenderQueue` factory function per pass (each calls `wp.createComputePass`/`createRenderPass` then `pass.writeBuffer(...)` to bind buffers to shader binding indices), and `applyVariableShaderCode` for simple textual substitution into `.wgsl` source (e.g. `@WORKGROUP_SIZE` placeholders) before shader module compilation. WGSL files are imported with Vite's `?raw` suffix.

- **`setting.ts`** — global constants: `DEBUG_MODE` (enables GPU timestamp queries and print-buffer readback plumbing), `DEBUG_PRINT` / `DEBUG_PASSTIMESTAMP` (what to actually log once `DEBUG_MODE` is on), `FPS`, `DT`, `WORKGROUP_SIZE`.

### Extending the template for a new project

1. Define buffers in `AppBuffers` (`shader_queue.ts`) and allocate them in `App.createBuffer()` (`main.ts`) via `wp.createBuffer(size, initialData, usage)`.
2. Subclass `GPUSetting` with the uniform fields and `static BYTE_SIZE`, and pass it to `new ParamsBuffer({ gpu })`.
3. Write `.wgsl` shaders, import with `?raw`, and add `PassQueue`/`PassRenderQueue` factories in `shader_queue.ts`.
4. Wire passes into `App.setQueue()` in `main.ts`, pushing onto `wp.computePasses` / `wp.renderPasses` in execution order (the `idx` passed to `createComputePass`/`createRenderPass` is the pass's slot in that array).
5. Use `App.guiSetting()` to add `lil-gui` controls that mutate `params.gpu.*` / `params.cpu.*` / `wp.config.*` and call `renewSettingGPUBuffer()` to push CPU-side param changes to the GPU uniform buffer.

Everything above the "예시" (example) comment blocks in each file is the live, working scaffold; everything below/inside those blocks is reference material from a prior FLIP-simulation project and is not executed.
