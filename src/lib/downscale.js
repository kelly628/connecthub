// Shrink an image before it's uploaded.
//
// This isn't only about bandwidth. Photos come off phones at 4MB+, and every
// avatar rides along on every roster fetch — so without this, a team of twenty
// would drag tens of megabytes across the wire on every poll. 512px JPEG takes
// a phone photo to roughly 25KB and still looks sharp in a 60px circle.

const MAX_EDGE = 512;
const QUALITY  = 0.85;

export async function downscale(file, maxEdge = MAX_EDGE) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // JPEG has no alpha — without this, transparent PNG logos come out black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('encode failed');
    return blob;
  } finally {
    bitmap.close?.();
  }
}
