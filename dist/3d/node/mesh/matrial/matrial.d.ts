import type { WebGPUTexture } from "../../../../types/resource";
import { Vector4, type Vector3 } from "../../../math/vector";
import { Specular } from "./specular";
export interface MatrialParams {
    color: Vector3;
    opacity?: number;
    specular?: Specular;
    device?: GPUDevice;
    imageBitmap?: ImageBitmap;
}
export declare class Matrial {
    color: Vector3;
    texture: WebGPUTexture | null;
    textureFlag: number;
    opacity: number;
    specualr: Specular;
    constructor({ color, opacity, specular, device, imageBitmap }: MatrialParams);
    private createTexture;
    getColor(): Vector4;
    getDataArray(): Float32Array<ArrayBufferLike>;
}
//# sourceMappingURL=matrial.d.ts.map