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
    private _color;
    texture: WebGPUTexture | null;
    textureFlag: number;
    private _opacity;
    private _specualr;
    dirty: boolean;
    private _cachedData;
    constructor({ color, opacity, specular, device, imageBitmap }: MatrialParams);
    get color(): Vector3;
    set color(v: Vector3);
    get opacity(): number;
    set opacity(v: number);
    get specualr(): Specular;
    set specualr(v: Specular);
    private createTexture;
    getColor(): Vector4;
    getDataArray(): Float32Array<ArrayBufferLike>;
}
//# sourceMappingURL=matrial.d.ts.map