import heic2any from "heic2any"

/**
 * HEIC support switch.
 *
 * - `false` (current): HEIC/HEIF photos are NOT accepted anywhere in the app.
 *   The file picker excludes them and the analyzer rejects them with a helpful
 *   message (see HEIC_REJECTION_MESSAGE), so nothing is uploaded or converted.
 * - `true`: HEIC/HEIF photos are accepted and converted to JPEG in the browser
 *   (via heic2any) before preview and upload, so the rest of the pipeline only
 *   ever sees JPEG.
 *
 * The conversion code below is intentionally written but unused while the flag
 * is off. Flip this one constant to `true` to turn HEIC support on — no other
 * changes are needed.
 */
export const HEIC_CONVERSION_ENABLED = false

const HEIC_TYPE_RE = /heic|heif/i
const HEIC_EXT_RE = /\.heic$|\.heif$/i

/** True when a file looks like a HEIC/HEIF image (by MIME type or extension). */
export function isHeicFile(file: File): boolean {
  return HEIC_TYPE_RE.test(file.type || "") || HEIC_EXT_RE.test(file.name)
}

/** File-picker accept list — includes HEIC/HEIF only while the flag is on. */
export const IMAGE_ACCEPT = HEIC_CONVERSION_ENABLED
  ? "image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
  : "image/png,image/jpeg,image/webp,image/gif"

/** Shown when a HEIC file reaches the analyzer while the flag is off. */
export const HEIC_REJECTION_MESSAGE =
  "HEIC photos aren't supported yet — convert it to JPG first, then select it again."

/**
 * Convert a HEIC/HEIF file to a JPEG File in the browser.
 * Only called while HEIC_CONVERSION_ENABLED is true.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
  const blob = Array.isArray(result) ? result[0] : result
  const baseName = file.name.replace(/\.(heic|heif)$/i, "")
  return new File([blob], `${baseName || "photo"}.jpg`, { type: "image/jpeg" })
}
