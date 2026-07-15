/**
 * Generate a Cloudinary fetch URL that transforms an image to JPEG.
 * This allows HEIC/HEIF files to be viewed in the browser as JPEG.
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
