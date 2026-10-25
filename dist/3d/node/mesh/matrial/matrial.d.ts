import { Vector4, type Vector3 } from "../../../math/vector";
import { Specular } from "./specular";
export interface MatrialParams {
    color: Vector3;
    opacity?: number;
    specular?: Specular;
}
export declare class Matrial {
    color: Vector3;
    opacity: number;
    specualr: Specular;
    constructor({ color, opacity, specular }: MatrialParams);
    getColor(): Vector4;
    getDataArray(): Float32Array<ArrayBufferLike>;
}
//# sourceMappingURL=matrial.d.ts.map