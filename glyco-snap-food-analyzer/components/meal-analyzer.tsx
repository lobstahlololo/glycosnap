"use client"

import { useRef, useState } from "react"
import { ArrowRight, ImagePlus, Loader2, X, FileImage } from "lucide-react"
import { analyzeMealAction, type MealAnalysis } from "@/app/actions"

export function MealAnalyzer({
  onAnalyzed,
}: {
  onAnalyzed: (data: MealAnalysis) => void
}) {
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [conversionFailed, setConversionFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function isHeic(file: File): boolean {
    return (
      /\.hei[cf]$/i.test(file.name) ||
      file.type === "image/heic" ||
      file.type === "image/heif"
    )
  }

  function setFileState(selected: File | null) {
    setFile(selected)
    setConversionFailed(false)
    if (preview) URL.revokeObjectURL(preview)
    if (selected && !isHeic(selected)) {
      setPreview(URL.createObjectURL(selected))
    } else {
      setPreview(null)
    }
  }

  async function handleFile(selected: File | null) {
    if (!selected) {
      setFileState(null)
      return
    }

    // Store the original file regardless (Gemini supports HEIC natively).
    setFile(selected)
    setConversionFailed(false)
    setError(null)

    // Revoke old preview
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)

    if (!isHeic(selected)) {
      // JPEG/PNG – show preview directly
      setPreview(URL.createObjectURL(selected))
      return
    }

    // HEIC – try converting for preview only (Gemini gets the original file)
    setConverting(true)
    try {
      const heic2any = (await import("heic2any")).default
      const converted = await heic2any({ blob: selected, toType: "image/jpeg", quality: 0.85 })
      const jpegBlob = Array.isArray(converted) ? converted[0] : converted
      setPreview(URL.createObjectURL(jpegBlob))
    } catch {
      // Preview conversion failed – that's OK, show a placeholder.
      // The original HEIC still gets sent to Gemini, which supports it.
      setConversionFailed(true)
    } finally {
      setConverting(false)
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

    const formData = new FormData()
    if (hasText) formData.set("description", description.trim())
    if (file) formData.set("image", file)

    setLoading(true)
    try {
      const result = await analyzeMealAction(formData)
      if (result.ok) {
        onAnalyzed(result.data)
        setDescription("")
        clearImage()
      } else {
        setError(result.error)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
        {converting ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-9 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Preparing photo...</span>
            <span className="text-xs text-muted-foreground">Hang tight, this only takes a moment</span>
          </div>
        ) : conversionFailed ? (
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

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || converting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Simmering the numbers...
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
