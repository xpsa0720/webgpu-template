import type { EncoderCallback } from "../types/callback";
import type { CreatePassTimeTag, OutGPUBuffer } from "../types/pass";
import type { PrintGPUBuffer, PrintType } from "../types/print";
import type {
  WebGPUBuffer,
  WebGPUSampler,
  WebGPUTexture,
} from "../types/resource";

export interface PassArg {
  device: GPUDevice;
  shaderCode: string;
  label?: string;
  time?: CreatePassTimeTag;
  encoderCallback?: EncoderCallback;
  preEncoderCallback?: EncoderCallback;
}

export interface PassBuffer extends WebGPUBuffer {
  isPrint: boolean;
  label: string;
  type: PrintType;
  print?: PrintGPUBuffer;
}

export interface PassTexture extends WebGPUTexture {
  label: string;
}
export interface PassSampler extends WebGPUSampler {
  label: string;
}

interface WriteBufferArg {
  bindigIdx: number;
  bufferObj: WebGPUBuffer;
  isPrint?: boolean;
  print?: PrintGPUBuffer;
  label?: string;
  type?: PrintType;
}

interface WriteTextureArg {
  bindigIdx: number;
  textureObj: WebGPUTexture;
  label?: string;
}

interface WriteSamplerArg {
  bindigIdx: number;
  samplerObj: WebGPUSampler;
  label?: string;
}

export interface DebugPassArg {
  querySet: GPUQuerySet;
  time?: CreatePassTimeTag;
}

export class Pass {
  buffers: Record<number, PassBuffer>;
  textures: Record<number, PassTexture>;
  sampler: Record<number, PassSampler>;
  shaderCode: string;
  shaderModule: GPUShaderModule;
  device: GPUDevice;
  label: string;
  time?: CreatePassTimeTag;
  encoderCallback?: EncoderCallback;
  preEncoderCallback?: EncoderCallback;
  constructor(arg: PassArg) {
    if (!arg.device) {
      throw Error("Device not initialized");
    }
    this.shaderCode = arg.shaderCode;
    this.buffers = [];
    this.textures = [];
    this.sampler = [];
    this.device = arg.device;
    this.shaderModule = this.device.createShaderModule({
      code: this.shaderCode,
    });
    this.label = arg.label ?? "";
    this.time = arg.time;
    this.encoderCallback = arg.encoderCallback;
    this.preEncoderCallback = arg.preEncoderCallback;
  }

  writeBuffer(bindingBuffers: WriteBufferArg[]) {
    bindingBuffers.forEach((buffer) => {
      const bindigIdx = buffer.bindigIdx;
      const bufferObj = buffer.bufferObj;
      const isPrint = buffer.isPrint;
      const label = buffer.label;
      const type = buffer.type ?? "f32";
      const print = buffer.print;
      if (this.buffers[bindigIdx]) {
        throw Error(
          "Binding index already occupied",
        );
      }
      const buf: PassBuffer = {
        buffer: bufferObj.buffer,
        label: label ?? "None Label",
        isPrint: isPrint ?? false,
        type: type,
        print: print,
      };

      this.buffers[bindigIdx] = buf;
    });
  }

  writeTexture(bindingTextures: WriteTextureArg[]) {
    bindingTextures.forEach((texture) => {
      const bindigIdx = texture.bindigIdx;
      const bufferObj = texture.textureObj;
      const label = texture.label;

      if (this.textures[bindigIdx]) {
        throw Error(
          "Binding index already occupied",
        );
      }
      const tex: PassTexture = {
        texture: bufferObj.texture,
        label: label ?? "None Label",
      };

      this.textures[bindigIdx] = tex;
    });
  }

  writeSampler(bindingSampler: WriteSamplerArg[]) {
    bindingSampler.forEach((sampler) => {
      const bindigIdx = sampler.bindigIdx;
      const bufferObj = sampler.samplerObj;
      const label = sampler.label;

      if (this.sampler[bindigIdx]) {
        throw Error(
          "Binding index already occupied",
        );
      }
      const sam: PassSampler = {
        sampler: bufferObj.sampler,
        label: label ?? "None Label",
      };

      this.sampler[bindigIdx] = sam;
    });
  }

  deleteBuffer(bindigIdx: number) {
    if (!this.buffers[bindigIdx]) {
      throw Error("No buffer at this binding index");
    }
    delete this.buffers[bindigIdx];
  }

  createPass(
    encoder: GPUCommandEncoder,
    debugArg?: DebugPassArg,
  ): OutGPUBuffer[] {
    const stagingBuffers: Array<OutGPUBuffer> = [];

    for (const [, value] of Object.entries(this.buffers)) {
      if (!value.isPrint) {
        continue;
      }
      const stagingBuffer = this.device.createBuffer({
        size: value.buffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      const buffer = value.buffer;
      encoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, buffer.size);

      stagingBuffers.push({
        staginigBuffer: stagingBuffer,
        label: value.label,
        type: value.type,
        print: value.print,
      });
    }
    // if (this.encoderCallback) this.encoderCallback(encoder);
    return stagingBuffers;
  }
}
