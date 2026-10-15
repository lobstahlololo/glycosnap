import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif",
          "image/gif",
        ],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
        tokenPayload: JSON.stringify({}),
      }),
      onUploadCompleted: async ({ blob }) => {
        // The client already has the blob.url — this is a good spot to
        // persist the URL to a database if you add one later.
        console.log("Upload complete:", blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    )
  }
}
