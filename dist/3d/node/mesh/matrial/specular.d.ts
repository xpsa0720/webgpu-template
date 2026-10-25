import { Vector4 } from "../../../math/vector";
export interface SpecularParams {
    strength?: number;
    shininess?: number;
    color?: Vector4;
}
export declare class Specular {
    strength: number;
    shininess: number;
    color: Vector4;
    constructor({ strength, shininess, color, }: SpecularParams);
    getSpecualrArray(): (number | Vector4)[];
}
//# sourceMappingURL=specular.d.ts.map