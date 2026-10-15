/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow photo-sized base64 payloads through server actions (HEIC fallback path).
  serverActions: {
    bodySizeLimit: "15mb",
  },
}

export default nextConfig
