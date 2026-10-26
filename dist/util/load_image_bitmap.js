export async function loadImageBitmap(input) {
    if (typeof input === "string") {
        const res = await fetch(input);
        return createImageBitmap(await res.blob());
    }
    if (input instanceof Uint8Array) {
        return createImageBitmap(new Blob([input]));
    }
    return createImageBitmap(input);
}
//# sourceMappingURL=load_image_bitmap.js.map