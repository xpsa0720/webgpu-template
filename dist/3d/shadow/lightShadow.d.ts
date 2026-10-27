import type { Mat4x4 } from "../math/matrix";
export interface LightShadow {
    castShadow: boolean;
    pvMatrix: Mat4x4;
    dirty: boolean;
    shadowNear: number;
    shadowFar: number;
    updateMatrix(): void;
}
//# sourceMappingURL=lightShadow.d.ts.map