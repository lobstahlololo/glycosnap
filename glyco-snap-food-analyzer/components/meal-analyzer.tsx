"use client"

import { useRef, useState } from "react"
import { ArrowRight, ImagePlus, Loader2, X, FileImage, Upload } from "lucide-react"
import { upload } from "@vercel/blob/client"
import { analyzeMealAction, type MealAnalysis } from "@/app/actions"

/** Check if a file looks like HEIC/HEIF (no conversion needed — Gemini supports it natively) */
function isHeic(file: File): boolean {
  return (
    /\.hei[cf]$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  )
}

export function MealAnalyzer({
  onAnalyzed,
}: {
  onAnalyzed: (data: MealAnalysis) => void
}) {
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isHeicFile, setIsHeicFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(selected: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setError(null)
    setPreview(null)
    setIsHeicFile(false)
    setUploadProgress(0)

    if (!selected) {
      setFile(null)
      return
    }

    setFile(selected)

    if (isHeic(selected)) {
      // Gemini supports HEIC natively — show a placeholder
      setIsHeicFile(true)
    } else {
      setPreview(URL.createObjectURL(selected))
    }
  }

  function clearImage() {
    handleFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const hasText = description.trim().length > 0
    if (!hasText && !file) {
      setError("Describe your meal, add a photo, or both to analyze.")
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      // Build payload that will be sent to the server action
      const payload: {
        description?: string
        imageBase64?: string
        imageMimeType?: string
        imageUrl?: string
      } = {}
      if (hasText) payload.description = description.trim()

      if (file) {
        const mimeType =
          file.type || (isHeic(file) ? "image/heic" : "image/jpeg")

        // Try Vercel Blob first (works on Vercel deployment).
        // Falls back to base64 (works in preview/dev environments).
        let uploaded = false
        try {
          const { url } = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
            onUploadProgress: (progress) => {
              setUploadProgress(Math.round(progress.percentage ?? 0))
            },
          })
          payload.imageUrl = url
          payload.imageMimeType = mimeType
          uploaded = true
        } catch {
          // Vercel Blob unavailable — fall back to base64
          const buf = await file.arrayBuffer()
          const bytes = new Uint8Array(buf)
          let binary = ""
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          payload.imageBase64 = btoa(binary)
          payload.imageMimeType = mimeType
        }
      }

      // Send to the server action
      const result = await analyzeMealAction(payload)
      if (result.ok) {
        onAnalyzed(result.data)
        setDescription("")
        clearImage()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const showProgress = loading && file && uploadProgress > 0 && uploadProgress < 100

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]"
    >
      <label className="block">
        <span className="mb-2 block font-serif text-base font-medium text-foreground">
          Describe your meal
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Two scrambled eggs and a slice of whole wheat toast"
          rows={3}
          className="w-full resize-none rounded-2xl border-2 border-dashed border-border bg-background px-4 py-3 leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </label>

      <div className="mt-5">
        <span className="mb-2 block font-serif text-base font-medium text-foreground">
          Add a photo <span className="font-sans text-sm font-normal text-muted-foreground">(optional)</span>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          id="meal-image"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {isHeicFile ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-background">
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-9 text-center">
              <FileImage className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">{file?.name}</span>
              <span className="text-xs text-muted-foreground">
                HEIC photo selected — preview unavailable on this device
              </span>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-background transition hover:bg-foreground"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : preview ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected meal preview" className="max-h-64 w-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-background transition hover:bg-foreground"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="meal-image"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-9 text-center transition hover:border-ring hover:bg-secondary"
          >
            <ImagePlus className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Upload a meal photo</span>
            <span className="text-xs text-muted-foreground">PNG, JPG or HEIC, tap to browse</span>
          </label>
        )}
      </div>

      {/* Upload progress bar */}
      {showProgress && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-medium text-foreground">
              Uploading to cloud… {uploadProgress}%
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {uploadProgress > 0 && uploadProgress < 100
              ? `Uploading ${uploadProgress}%…`
              : "Analyzing meal…"}
          </>
        ) : (
          <>
            Analyze Meal
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
