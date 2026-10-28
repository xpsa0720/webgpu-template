import { SHADER_MATRIAL_STRUCT } from "../../../../shader/gadget/code/shader_code";
import { uniformData } from "../../../../util/uniform";
import { Vector4 } from "../../../math/vector";
import { Specular } from "./specular";
let dummyTexture = null;
function getOrCreateDummyTexture(device) {
    if (dummyTexture)
        return dummyTexture;
    dummyTexture = device.createTexture({
        size: [1, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture({ texture: dummyTexture }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4 }, [1, 1, 1]);
    return dummyTexture;
}
export class Matrial {
    _color;
    texture = null;
    textureFlag = 0;
    _opacity;
    _specualr;
    dirty = true;
    _cachedData = null;
    castShadow;
    receiveShadow;
    shadowKernelLength;
    constructor({ color, opacity = 1, specular = new Specular({}), device, imageBitmap, castShadow, receiveShadow, shadowKernelLength }) {
        this._color = color;
        this._opacity = opacity;
        this._specualr = specular;
        this.castShadow = castShadow ?? false;
        this.receiveShadow = receiveShadow ?? false;
        this.shadowKernelLength = shadowKernelLength ?? 3;
        if (device) {
            this.texture = { texture: this.createTexture(device, imageBitmap) };
            this.textureFlag = imageBitmap ? 1 : 0;
        }
    }
    get color() { return this._color; }
    set color(v) { this._color = v; this.dirty = true; this._cachedData = null; }
    get opacity() { return this._opacity; }
    set opacity(v) { this._opacity = v; this.dirty = true; this._cachedData = null; }
    get specualr() { return this._specualr; }
    set specualr(v) { this._specualr = v; this.dirty = true; this._cachedData = null; }
    createTexture(device, imageBitmap) {
        if (!imageBitmap) {
            return getOrCreateDummyTexture(device);
        }
        const texture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: false }, { texture }, { width: imageBitmap.width, height: imageBitmap.height });
        return texture;
    }
    getColor() {
        return new Vector4(this.color.x, this.color.y, this.color.z, this.opacity);
    }
    getDataArray() {
        if (this._cachedData && !this.dirty)
            return this._cachedData;
        this._cachedData = uniformData(SHADER_MATRIAL_STRUCT, {
            baseColor: this.getColor(),
            specualrColor: this._specualr.color,
            specualrShininess: this._specualr.shininess,
            specualrStrength: this._specualr.strength,
            texturFlag: this.textureFlag,
            receiveShadow: this.receiveShadow ? 1 : 0,
            shadowKernelLength: this.shadowKernelLength,
        });
        this.dirty = false;
        return this._cachedData;
    }
}
//# sourceMappingURL=matrial.js.map