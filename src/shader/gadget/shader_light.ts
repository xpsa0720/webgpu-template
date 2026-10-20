import type { Vector3, Vector4 } from "../../3d/math/vector";
import { ShaderGadget, type ShaderGadgetParams } from "./shader_gadget";

export interface ShaderLightGadgetParams<T extends Light> extends ShaderGadgetParams {
  define: string;
  struct: string;
  group: number;
  binding: number;
  func: string;
  code: string;
  lights?: T[];
  countPlaceholder:string,
}

export class ShaderLightGadget<T extends Light> extends ShaderGadget {
  struct: string;
  define: string;
  group: number;
  func: string;
  code: string;
  binding: number;
  countPlaceholder: string;
  private _lights: T[];

  constructor({
    struct,
    define,
    placeholder,
    binding,
    group,
    code,
    func,
    lights = [],
    countPlaceholder,
  }: ShaderLightGadgetParams<T>) {
    super({ placeholder });
    this.struct = struct;
    this.define = define;
    this.group = group;
    this.code = code;
    this.func = func;
    this.binding = binding;
    this._lights = [];
    this.countPlaceholder = countPlaceholder;

    if(!this.placeholder[this.countPlaceholder]){
      throw new Error("플레이스홀더 값이 잘못 됐습니다!")
    }

    lights.forEach((l) => this.addLight(l));
  }

  get lights(): readonly T[] {
    return this._lights;
  }

  set lights(value: T[]) {
    this._lights = value;
    this.updateCount();
  }

  addLight(light: T) {
    this._lights.push(light);
    this.updateCount();
  }

  removeLight(index: number): T | undefined {
    const removed = this._lights.splice(index, 1)[0];
    this.updateCount();
    return removed;
  }

  private updateCount() {
    this.placeholder[this.countPlaceholder] = String(Math.max(1, this._lights.length));
  }

  getCode() {
    return super.getCode(this.code);
  }

  getFunctionCode() {
    return super.getCode(this.func);
  }

  getStructUniformCode() {
    let result = "";
    result += this.struct+"\n";
    result += this.define+"\n";

    return super.getCode(result);
  }

  getDataBuffer(device:GPUDevice){
    return device.createBuffer({
      usage: GPUBufferUsage.COPY_DST |GPUBufferUsage.UNIFORM,
      size:this._lights.length,
    })
  }
}

interface Light{
  intensity: number,
  color: Vector4
}

interface AmbientLight extends Light{
}

interface PointLight extends Light{
  position: Vector4;
}

interface DirectionalLight extends Light{
  directional: Vector4;
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
