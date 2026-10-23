import { Vector4 } from "../../3d/math/vector";
import type { WebGPUBuffer } from "../../types/resource";
import { gpuBufferSizeFormat, wgslStructSize } from "../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../util/uniform";
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
  onLightChange?: () => void;
}

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
    onLightChange,
  }: ShaderLightGadgetParams<T>) {
    super({ placeholder: { [countPlaceholder]: "0", ...placeholder } });
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
    this.onLightChange = onLightChange;
    this.gpuBuffer = this.createBuffer();

    lights.forEach((l) => this.addLight(l));
  }

  private createBuffer(): WebGPUBuffer {
    const buffer = this.device.createBuffer({
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      size: this.structSize * Math.max(1, this._lights.length),
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
      Math.max(1, this._lights.length),
    );
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

  // getInstanceCode() {
  //   if (this._lights.length === 0) return "";
  //   return super.getCode(this.instanceCode);
  // }

  // getInstanceFunctionCode() {
  //   if (this._lights.length === 0) return "";
  //   return super.getCode(this.instanceFunc);
  // }

  getStructUniformCode() {
    if (this._lights.length === 0) return "";
    let result = "";
    result += this.struct + "\n";
    result += this.define + "\n";

    return super.getCode(result);
  }

  // private getDataBuffer(device: GPUDevice) {
  //   return device.createBuffer({
  //     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  //     size: this._lights.length * 4,
  //   });
  // }
}

export interface LightParams {
  intensity?: number;
  color?: Vector4;
}

export class Light {
  intensity: number;
  color: Vector4;
  constructor({ intensity = 1, color = new Vector4(1, 1, 1, 1) }: LightParams = {}) {
    this.intensity = intensity;
    this.color = color;
  }
}

export interface AmbientLightParams extends LightParams {}

export class AmbientLight extends Light {
  constructor(params: AmbientLightParams = {}) {
    super(params);
  }
}

export interface PointLightParams extends LightParams {
  position?: Vector4;
}

export class PointLight extends Light {
  position: Vector4;
  constructor({ position = new Vector4(0, 0, 0, 1), ...rest }: PointLightParams = {}) {
    super(rest);
    this.position = position;
  }
}

export interface DirectionalLightParams extends LightParams {
  directional?: Vector4;
}

export class DirectionalLight extends Light {
  directional: Vector4;
  constructor({ directional = new Vector4(0, -1, 0, 0), ...rest }: DirectionalLightParams = {}) {
    super(rest);
    this.directional = directional;
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
