import type { OutGPUBuffer } from "../types/pass";
import type { DebugPassArg, PassArg } from "./pass";
import { RenderPass } from "./render_pass";

interface Render3DPassArg extends PassArg {
  target: GPUTexture | HTMLCanvasElement;
  vertexEntryPoint: string;
  fragmentEntryPoint: string;
  vertexCount: GPUSize32;
  instanceCount: GPUSize32;
  loadOp?: GPULoadOp;
  format?: GPUTextureFormat;
  blend?: boolean;
  debugMode?: boolean;
}

export class Render3DPass extends RenderPass{
    constructor(arg: Render3DPassArg){
        super(arg)

    }

    override createPass(
        encoder: GPUCommandEncoder,
        debugArg?: DebugPassArg,
      ): OutGPUBuffer[] {
        
        return super.createPass(encoder);
      }
}