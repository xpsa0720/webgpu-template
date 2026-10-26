export async function loadImageBitmap(input: string | Blob | Uint8Array): Promise<ImageBitmap> {
  if (typeof input === "string") {
    const res = await fetch(input);
    return createImageBitmap(await res.blob());
  }
  if (input instanceof Uint8Array) {
    return createImageBitmap(new Blob([input as Uint8Array<ArrayBuffer>]));
  }
  return createImageBitmap(input);
}
