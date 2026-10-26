import type { WebGPUBuffer } from "../../types/resource";
import { gpuBufferSizeFormat, wgslStructSize } from "../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../util/uniform";
import { roundUp } from "../../util/vertex_layout";
import type { AmbientLight } from "../../3d/light/ambient_light";
import type { DirectionalLight } from "../../3d/light/directional_light";
import type { Light } from "../../3d/light/light";
import type { PointLight } from "../../3d/light/point_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";

export interface ShaderLightGadgetParams<
  T extends Light,
> extends ShaderGadgetParams {
  define: string;
  struct: string;
  group: number;
  binding: number;
  func: string;
  code: string;
  // instanceFunc: string;
  // instanceCode: string;
  device: GPUDevice;
  lights?: T[];
  countPlaceholder: string;
  lengthPlaceholder: string;
  onLightChange?: () => void;
}

export const formatLightCount = 8

export abstract class ShaderLightGadget<T extends Light> extends ShaderGadget {
  struct: string;
  define: string;
  group: number;
  structSize: number;
  func: string;
  // instanceFunc: string;
  // instanceCode: string;
  device!: GPUDevice;
  code: string;
  binding: number;
  gpuBuffer: WebGPUBuffer;
  countPlaceholder: string;
  lengthPlaceholder: string;
  private _lights: T[];
  private onLightChange?: () => void;

  constructor({
    struct,
    define,
    placeholder,
    binding,
    group,
    code,
    device,
    func,
    // instanceFunc,
    // instanceCode,
    lights = [],
    countPlaceholder,
    lengthPlaceholder,
    onLightChange,
  }: ShaderLightGadgetParams<T>) {
    super({ placeholder: { [countPlaceholder]: "0", [lengthPlaceholder]: "0", ...placeholder } });
    this.struct = struct;
    this.define = define;
    this.group = group;
    this.structSize = wgslStructSize(struct);
    this.code = code;
    this.device = device;
    this.func = func;
    // this.instanceFunc = instanceFunc;
    // this.instanceCode = instanceCode;
    this.binding = binding;
    this._lights = lights;
    this.countPlaceholder = countPlaceholder;
    this.lengthPlaceholder = lengthPlaceholder;
    this.onLightChange = onLightChange;
    this.gpuBuffer = this.createBuffer();

    lights.forEach((l) => this.addLight(l));
  }

  private createBuffer(): WebGPUBuffer {
    const buffer = this.device.createBuffer({
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      size: this.structSize * Math.max(1, roundUp(formatLightCount, this._lights.length)),
    });

    const data = uniformDataArray<T>(this.struct,this.lights)

    this.device.queue.writeBuffer(buffer, 0, data);

    return {
      buffer,
    };
  }


  get lights(): readonly T[] {
    return this._lights;
  }

  set lights(value: T[]) {
    this._lights = value;
    this.updateCount();
    this.gpuBuffer = this.createBuffer();
    this.onLightChange?.();
  }

  addLight(light: T) {
    this._lights.push(light);
    this.updateCount();
    this.gpuBuffer = this.createBuffer();
    this.onLightChange?.();
  }

  removeLight(index: number): T | undefined {
    const removed = this._lights.splice(index, 1)[0];
    this.updateCount();
    this.gpuBuffer = this.createBuffer();
    this.onLightChange?.();
    return removed;
  }

  private updateCount() {
    this.placeholder[this.countPlaceholder] = String(
      Math.max(1, roundUp(formatLightCount, this._lights.length)),
    );
    this.placeholder[this.lengthPlaceholder] = String(this._lights.length);
  }

  updateLight(index: number){
    const data = uniformData<T>(this.struct, this.lights[index])
    this.device.queue.writeBuffer(this.gpuBuffer.buffer, index*this.structSize, data)
    this.onLightChange?.();
  }

  updateLightAll(){
    const data = uniformDataArray<T>(this.struct,this.lights)
    this.device.queue.writeBuffer(this.gpuBuffer.buffer, 0, data);
    this.onLightChange?.();
  }

  getCode() {
    if (this._lights.length === 0) return "";
    return super.getCode(this.code);
  }

  getFunctionCode() {
    if (this._lights.length === 0) return "";
    return super.getCode(this.func);
  }


  getStructUniformCode() {
    if (this._lights.length === 0) return "";
    let result = "";
    result += this.struct + "\n";
    result += this.define + "\n";

    return super.getCode(result);
  }
}

export class ShaderAmbientLightGadget extends ShaderLightGadget<AmbientLight> {
  constructor(params: ShaderLightGadgetParams<AmbientLight>) {
    super(params);
  }
}

export class ShaderPointLightGadget extends ShaderLightGadget<PointLight> {
  constructor(params: ShaderLightGadgetParams<PointLight>) {
    super(params);
  }
}

export class ShaderDirectionalLightGadget extends ShaderLightGadget<DirectionalLight> {
  constructor(params: ShaderLightGadgetParams<DirectionalLight>) {
    super(params);
  }
}
