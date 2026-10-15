/**
 * Generate a Cloudinary fetch URL that attempts to transform an image to JPEG
 * so HEIC/HEIF files can be viewed in the browser. This is best-effort:
 * fetch-based transformation may fail for some sources and on some devices.
 *
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to be set in your environment.
 *
 * Example output:
 *   https://res.cloudinary.com/{cloud}/image/fetch/f_jpg,q_auto/{sourceUrl}
 */
export function getCloudinaryPreviewUrl(sourceUrl: string): string | undefined {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud) return undefined

  return `https://res.cloudinary.com/${cloud}/image/fetch/f_jpg,q_auto/${encodeURIComponent(sourceUrl)}`
}
