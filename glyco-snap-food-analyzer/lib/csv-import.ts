import type { BloodSugarReading } from "@/app/actions"

export type CsvImportResult = {
  ok: boolean
  readings?: BloodSugarReading[]
  error?: string
  /** Detected source device, when known */
  source?: string
  /** Count of rows skipped due to bad formatting */
  skipped?: number
}

/** Best-effort timestamp parser — handles ISO strings, US format, etc. */
function parseTimestamp(s: string): Date | null {
  if (!s) return null
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d
  // LibreView: "MM/DD/YYYY hh:mm:ss" or "MM/DD/YYYY hh:mm"
  const m =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i.exec(
      s.trim(),
    )
  if (m) {
    let [, mo, da, yr, hh, mm, ss, pp] = m
    let h = parseInt(hh, 10)
    if (pp?.toUpperCase() === "PM" && h !== 12) h += 12
    if (pp?.toUpperCase() === "AM" && h === 12) h = 0
    const result = new Date(
      parseInt(yr, 10),
      parseInt(mo, 10) - 1,
      parseInt(da, 10),
      h,
      parseInt(mm, 10),
      ss ? parseInt(ss, 10) : 0,
    )
    return isNaN(result.getTime()) ? null : result
  }
  return null
}

function parseNumber(s: string): number | null {
  if (!s) return null
  const cleaned = s.replace(/[^\d.\-]/g, "")
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

/**
 * Parse a CSV exported from Dexcom Clarity, LibreView, Accu-Chek, or any
 * generic CGM/meter application. Tries to detect the time and value columns
 * from header keywords.
 */
export function parseCgmCsv(text: string): CsvImportResult {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: "Empty file" }
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return { ok: false, error: "CSV needs at least 2 rows (header + data)" }
  }

  const headerRaw = lines[0]
  const delimiter = headerRaw.includes("\t") ? "\t" : ","
  const headers = headerRaw.split(delimiter).map((h) => h.trim().toLowerCase())

  // Match time column
  const timeIdx = headers.findIndex((h) =>
    /^(date|time|datetime|timestamp|device time)$/i.test(h),
  )
  // Match glucose column — accept things like "glucose value", "historic glucose mg/dl", "reading"
  const valueIdx = headers.findIndex(
    (h) =>
      /(glucose|reading|bg|cgm|value)/i.test(h) &&
      !/(event|trend|delta|sensor)/i.test(h),
  )

  if (timeIdx < 0 || valueIdx < 0) {
    return {
      ok: false,
      error:
        "Couldn't locate time and glucose columns. Expected headers like 'Timestamp' and 'Glucose Value' (mg/dL or mmol/L).",
    }
  }

  const readings: BloodSugarReading[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter)
    if (cols.length <= Math.max(timeIdx, valueIdx)) {
      skipped++
      continue
    }
    const t = parseTimestamp(cols[timeIdx].trim())
    let v = parseNumber(cols[valueIdx])
    if (!t || v === null) {
      skipped++
      continue
    }

    // Convert mmol/L to mg/dL if needed (header hint targeting mmol/L)
    const isMmol = headers.some((h) => /mmol/i.test(h))
    if (isMmol && v < 40) {
      v = Math.round(v * 18.0182)
    }

    if (v <= 0 || v > 600) {
      skipped++
      continue
    }

    readings.push({
      id: crypto.randomUUID(),
      value: v,
      timestamp: t.toISOString(),
      note: "",
    })
  }

  if (readings.length === 0) {
    return {
      ok: false,
      error: "Could not extract any glucose readings from this CSV.",
    }
  }

  readings.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  const source = headers.some((h) => /dexcom/i.test(h))
    ? "Dexcom"
    : headers.some((h) => /libre/i.test(h))
      ? "FreeStyle Libre"
      : headers.some((h) => /accu.?chek/i.test(h))
        ? "Accu-Chek"
        : "Generic CGM/meter"

  return { ok: true, readings, source, skipped }
}
