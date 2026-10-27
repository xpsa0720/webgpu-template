import type { WebGPUBuffer } from "../../types/resource";
import { gpuBufferSizeFormat, wgslStructSize } from "../../util/math";
import { parseStructLayout, uniformData, uniformDataArray } from "../../util/uniform";
import { roundUp } from "../../util/vertex_layout";
import type { AmbientLight } from "../../3d/light/ambient_light";
import type { DirectionalLight } from "../../3d/light/directional_light";
import type { Light } from "../../3d/light/light";
import type { PointLight } from "../../3d/light/point_light";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";
import {
  SHADER_DIRECTIONAL_LIGHT_PV_MATRIX,
  SHADER_DIRECTIONAL_SHADOW_TEXTURE,
  SHADER_POINT_LIGHT_PV_MATRIX,
  SHADER_POINT_SHADOW_TEXTURE,
} from "./code/shader_code";

export interface ShadowGadgetParams {
  shadowAddFunc: string;
  shadowAddCode: string;
}

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
  // instanceCode: string;
  // instanceFunc: string;
  device!: GPUDevice;
  code: string;
  binding: number;
  gpuBuffer: WebGPUBuffer;
  countPlaceholder: string;
  lengthPlaceholder: string;
  private _lights: T[];
  private onLightChange?: () => void;
  private _bufferCapacity: number = 0; // 현재 버퍼가 수용 가능한 light 수 (roundUp 단위)

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
    this._bufferCapacity = Math.max(1, roundUp(formatLightCount, this._lights.length));
    const buffer = this.device.createBuffer({
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      size: this.structSize * this._bufferCapacity,
    });

    const data = uniformDataArray<T>(this.struct, this.lights);
    this.device.queue.writeBuffer(buffer, 0, data);

    return { buffer };
  }

  /** 버퍼 용량이 충분하면 writeBuffer만, 부족하면 새로 생성 */
  private ensureBuffer() {
    const needed = Math.max(1, roundUp(formatLightCount, this._lights.length));
    if (needed > this._bufferCapacity) {
      this.gpuBuffer.buffer.destroy();
      this.gpuBuffer = this.createBuffer();
    } else {
      const data = uniformDataArray<T>(this.struct, this.lights);
      this.device.queue.writeBuffer(this.gpuBuffer.buffer, 0, data);
    }
  }


  get lights(): readonly T[] {
    return this._lights;
  }

  set lights(value: T[]) {
    this._lights = value;
    this.updateCount();
    this.ensureBuffer();
    this.onLightChange?.();
  }

  addLight(light: T) {
    this._lights.push(light);
    this.updateCount();
    this.ensureBuffer();
    this.onLightChange?.();
  }

  removeLight(index: number): T | undefined {
    const removed = this._lights.splice(index, 1)[0];
    this.updateCount();
    this.ensureBuffer();
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
export interface ShadowGadget {
  shadowPvMatrixDefine: string;
  shadowTextureDefine: string;
  shadowAddFunc:string,
  shadowAddCode:string,
  getShadowDefinesCode():string
  getShadowAddCode():string
  getShadowAddFuncCode():string
}

export class ShaderAmbientLightGadget extends ShaderLightGadget<AmbientLight> {
  constructor(params: ShaderLightGadgetParams<AmbientLight>) {
    super(params);
  }
}

export class ShaderPointLightGadget extends ShaderLightGadget<PointLight> implements ShadowGadget {
  shadowPvMatrixDefine: string;
  shadowTextureDefine: string;
  shadowAddFunc: string;
  shadowAddCode: string;

  constructor(params: ShaderLightGadgetParams<PointLight> & ShadowGadgetParams) {
    super({
      ...params,
      placeholder: {
        ...params.placeholder,
        "@POINT_LIGHT_COMPARE_CODE": params.shadowAddCode,
        "@POINT_SHADOW_VISIBILTY_FUNC_CODE": params.shadowAddFunc,
      },
    });
    this.shadowPvMatrixDefine = SHADER_POINT_LIGHT_PV_MATRIX;
    this.shadowTextureDefine = SHADER_POINT_SHADOW_TEXTURE;
    this.shadowAddFunc = params.shadowAddFunc;
    this.shadowAddCode = params.shadowAddCode;
  }

  getShadowDefinesCode() {
    if (this.lights.length === 0) return "";
    return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
  }

  getShadowAddCode() {
    if (this.lights.length === 0) return "";
    return this.shadowAddCode;
  }

  getShadowAddFuncCode() {
    if (this.lights.length === 0) return "";
    return this.shadowAddFunc;
  }
}

export class ShaderDirectionalLightGadget extends ShaderLightGadget<DirectionalLight> implements ShadowGadget {
  shadowPvMatrixDefine: string;
  shadowTextureDefine: string;
  shadowAddFunc: string;
  shadowAddCode: string;

  constructor(params: ShaderLightGadgetParams<DirectionalLight> & ShadowGadgetParams) {
    super({
      ...params,
      placeholder: {
        ...params.placeholder,
        "@DIRECTIONAL_LIGHT_COMPARE_CODE": params.shadowAddCode,
        "@DIRECTIONAL_SHADOW_VISIBILTY_FUNC_CODE": params.shadowAddFunc,
      },
    });
    this.shadowPvMatrixDefine = SHADER_DIRECTIONAL_LIGHT_PV_MATRIX;
    this.shadowTextureDefine = SHADER_DIRECTIONAL_SHADOW_TEXTURE;
    this.shadowAddFunc = params.shadowAddFunc;
    this.shadowAddCode = params.shadowAddCode;
  }

  getShadowDefinesCode() {
    if (this.lights.length === 0) return "";
    return this.shadowTextureDefine + "\n" + this.shadowPvMatrixDefine + "\n";
  }

  getShadowAddCode() {
    if (this.lights.length === 0) return "";
    return this.shadowAddCode;
  }

  getShadowAddFuncCode() {
    if (this.lights.length === 0) return "";
    return this.shadowAddFunc;
  }
}
