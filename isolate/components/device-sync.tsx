"use client"

import { useRef, useState } from "react"
import {
  Bluetooth,
  Activity,
  Watch,
  Wifi,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Cable,
  Rocket,
  FileSpreadsheet,
} from "lucide-react"
import type { BloodSugarReading } from "@/app/actions"
import { parseCgmCsv, type CsvImportResult } from "@/lib/csv-import"

type Device = {
  id: string
  name: string
  category: "cgm" | "meter"
  models: string[]
  /** Where to get the CSV (help tooltip) */
  csvHelp: string
  icon: React.ReactNode
  accent: string
}

const DEVICES: Device[] = [
  {
    id: "dexcom",
    name: "Dexcom",
    category: "cgm",
    models: ["G6", "G7"],
    csvHelp:
      "Sign in to clarity.dexcom.com → Reports → export a CSV. Or use Dexcom Studio.",
    icon: <Wifi className="h-5 w-5" />,
    accent: "#5b8fb8",
  },
  {
    id: "libre",
    name: "FreeStyle Libre",
    category: "cgm",
    models: ["Libre 2", "Libre 3"],
    csvHelp:
      "Sign in to libreview.com → Reports → Glucose History → Download CSV.",
    icon: <Activity className="h-5 w-5" />,
    accent: "#a86b3c",
  },
  {
    id: "eversense",
    name: "Eversense",
    category: "cgm",
    models: ["E3", "365"],
    csvHelp: "Log in to your Eversense account → Reports → Export glucose data.",
    icon: <Activity className="h-5 w-5" />,
    accent: "#7a5fa0",
  },
  {
    id: "accuchek",
    name: "Accu-Chek",
    category: "meter",
    models: ["Guide", "Aviva", "Smart Pix"],
    csvHelp: "Connect meter via USB → Accu-Chek Smart Pix → Export CSV.",
    icon: <Bluetooth className="h-5 w-5" />,
    accent: "#c47a92",
  },
  {
    id: "onetouch",
    name: "OneTouch",
    category: "meter",
    models: ["Verio Flex", "Verio Reflect"],
    csvHelp: "Sync meter with OneTouch Reveal app → Export glucose log as CSV.",
    icon: <Watch className="h-5 w-5" />,
    accent: "#6e8a3e",
  },
]

export function DeviceSync({
  onImport,
}: {
  onImport: (readings: BloodSugarReading[], source: string) => void
}) {
  const [activeDevice, setActiveDevice] = useState<string | null>(null)
  const [oauthTarget, setOauthTarget] = useState<string | null>(null)
  const [oauthMessage, setOauthMessage] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<{
    source: string
    count: number
    skipped: number
  } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setImportStatus(null)
    setImportError(null)
    const text = await file.text()
    const result: CsvImportResult = parseCgmCsv(text)
    if (!result.ok || !result.readings) {
      setImportError(result.error ?? "Could not parse CSV")
      return
    }
    setImportStatus({
      source: result.source ?? "CSV",
      count: result.readings.length,
      skipped: result.skipped ?? 0,
    })
    onImport(result.readings, result.source ?? "CSV")
  }

  function triggerCsvUpload(deviceId: string) {
    setActiveDevice(deviceId)
    setImportStatus(null)
    setImportError(null)
    setOauthMessage(null)
    // Use setTimeout to ensure ref is in the DOM after re-render
    setTimeout(() => inputRef.current?.click(), 0)
  }

  function applyOauth(deviceId: string) {
    const device = DEVICES.find((d) => d.id === deviceId)
    if (!device) return
    setOauthTarget(deviceId)
    setImportStatus(null)
    setImportError(null)
    // Honest scaffold: real OAuth requires vendor partner credentials.
    setOauthMessage(
      `${device.name} OAuth handshake requires partner credentials from ${device.name}.` +
        ` Until credentials are configured, choose the CSV option above — it works today.`,
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          if (!activeDevice) return
          const file = e.target.files?.[0]
          if (file) await handleFile(file)
          if (inputRef.current) inputRef.current.value = ""
          setActiveDevice(null)
        }}
      />

      <section
        className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]"
        id="devices"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Cable className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold text-card-foreground">
                Connect a Device
              </h3>
              <p className="text-xs text-muted-foreground">
                Sync a CGM or upload readings from any blood glucose meter.
              </p>
            </div>
          </div>
        </div>

        {/* Connected/import feedback */}
        {importStatus && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#e7efe0] px-4 py-3 text-sm text-[#42583a]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">Imported {importStatus.count} readings</span>
            <span className="text-xs">from {importStatus.source}</span>
            {importStatus.skipped > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {importStatus.skipped} row{importStatus.skipped === 1 ? "" : "s"} skipped
              </span>
            )}
          </div>
        )}
        {importError && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#f3ddd3] px-4 py-3 text-sm text-[#8f3f28]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{importError}</span>
          </div>
        )}
        {oauthMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#f6e8d1] px-4 py-3 text-sm text-[#8a5a1f]">
            <Rocket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{oauthMessage}</span>
            <button
              type="button"
              onClick={() => setOauthMessage(null)}
              className="ml-auto rounded-full p-1 text-[#8a5a1f] hover:bg-[#e6cfa2]"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEVICES.map((d) => (
            <div
              key={d.id}
              className="flex flex-col rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: d.accent }}
                  aria-hidden="true"
                >
                  {d.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.category === "cgm" ? "CGM" : "Meter"} · {d.models.join(", ")}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => applyOauth(d.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  Connect
                </button>
                <button
                  type="button"
                  onClick={() => triggerCsvUpload(d.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground transition hover:border-ring hover:bg-secondary"
                >
                  <Upload className="h-3 w-3" aria-hidden="true" />
                  Import CSV
                </button>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  How do I get my file?
                </summary>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {d.csvHelp}
                </p>
              </details>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            GlycoSnap accepts any CGM or meter CSV with a recognizable timestamp and glucose column
            (Dexcom Clarity, LibreView, Accu-Chek Smart Pix, etc.). Files stay on your device —
            they&apos;re never uploaded to a server.
          </span>
        </p>
      </section>
    </>
  )
}
