export async function loadImageBitmap(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return createImageBitmap(blob);
}
//# sourceMappingURL=load_image_bitmap.js.map