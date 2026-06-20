/**
 * Client-side canvas helper for the image cropper. Applies the user's rotation
 * and crop selection, then exports a compressed JPEG Blob — capping the longest
 * edge so large photos shrink before they're sent to Gemini Vision.
 *
 * The output is always image/jpeg, which normalizes any browser-decodable input
 * (png / jpeg / webp) to a Gemini-native format.
 */

/** A crop rectangle in source-image pixels (react-easy-crop's croppedAreaPixels). */
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Longest-edge cap and JPEG quality for the exported image. */
const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load image.")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Bounding box of an image after rotation, used to size the work canvas. */
function rotatedBounds(width: number, height: number, rotation: number) {
  const rad = toRad(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Produce a cropped, rotated, compressed JPEG Blob from an image source.
 *
 * @param src       Object URL / data URL of the source image.
 * @param crop      Crop rectangle in source pixels (from onCropComplete).
 * @param rotation  Rotation in degrees applied in the cropper.
 */
export async function getCroppedImg(
  src: string,
  crop: PixelCrop,
  rotation = 0,
): Promise<Blob> {
  const image = await loadImage(src);

  // Draw the rotated image onto a work canvas sized to its rotated bounds.
  const work = document.createElement("canvas");
  const workCtx = work.getContext("2d");
  if (!workCtx) throw new Error("Could not get a canvas context.");

  const bounds = rotatedBounds(image.width, image.height, rotation);
  work.width = bounds.width;
  work.height = bounds.height;

  workCtx.translate(bounds.width / 2, bounds.height / 2);
  workCtx.rotate(toRad(rotation));
  workCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Scale the crop down so its longest edge fits MAX_EDGE (compression).
  const scale = Math.min(1, MAX_EDGE / Math.max(crop.width, crop.height));
  const outW = Math.round(crop.width * scale);
  const outH = Math.round(crop.height * scale);

  const out = document.createElement("canvas");
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Could not get a canvas context.");
  out.width = outW;
  out.height = outH;

  outCtx.drawImage(
    work,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export the cropped image."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
