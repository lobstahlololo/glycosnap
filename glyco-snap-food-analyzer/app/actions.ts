"use server"

export type MealAnalysis = {
  meal_name: string
  total_calories: number
  total_net_carbs_g: number
  total_protein_g: number
  total_fat_g: number
  glycemic_load: "Low" | "Medium" | "High"
  clinical_note: string
  brand_or_restaurant: string
  suggested_google_search_query: string
}

export type AnalyzeResult =
  | { ok: true; data: MealAnalysis }
  | { ok: false; error: string }

export type BloodSugarReading = {
  id: string
  value: number // mg/dL
  timestamp: string // ISO string
  note: string
}

export type GlucoseInsight = {
  trend_summary: string
  tips: string[]
  concern_level: "Good" | "Caution" | "Elevated"
}

export type GlucoseInsightResult =
  | { ok: true; data: GlucoseInsight }
  | { ok: false; error: string }

const MEAL_SYSTEM_INSTRUCTION = `You are a clinical diabetes tracking assistant used inside a medical-grade nutrition app.
Analyze the provided meal (from a text description and/or a food image) and estimate its nutritional content
with a focus on blood-glucose impact for people managing diabetes.

Respond with ONLY a single valid, raw JSON object. Do NOT wrap it in markdown code fences, and do NOT add any
prose before or after. The JSON MUST match this exact schema and types:

{
  "meal_name": string,            // concise name of the identified meal
  "total_calories": number,       // estimated kilocalories
  "total_net_carbs_g": number,    // total carbohydrates minus fiber, in grams
  "total_protein_g": number,      // grams of protein
  "total_fat_g": number,          // grams of fat
  "glycemic_load": "Low" | "Medium" | "High",
  "clinical_note": string,        // a short warning/insight about hidden sugars, absorption rate, or timing
  "brand_or_restaurant": string,  // detected brand/restaurant name (e.g. "Chobani", "Starbucks", "Kraft"). Empty string "" if it is generic unbranded food
  "suggested_google_search_query": string // if a brand is detected, a clean optimized search string (e.g. "Chobani Greek Yogurt plain nutrition facts"). Empty string "" if no brand detected
}

If you cannot identify the food, make your best reasonable estimate rather than refusing.`

const GLUCOSE_SYSTEM_INSTRUCTION = `You are a clinical diabetes educator assistant inside a nutrition tracking app.
A user has logged their blood sugar readings alongside meals they ate. Analyze the combined data
and provide personalized, actionable insights.

Respond with ONLY a single valid, raw JSON object. Do NOT wrap it in markdown code fences. The JSON MUST match this exact schema:

{
  "trend_summary": string,       // 1-2 sentences summarizing the overall glucose trend
  "tips": string[],              // 2-4 actionable, specific tips based on the data
  "concern_level": "Good" | "Caution" | "Elevated"   // overall assessment
}

Tips should reference specific meals or readings when relevant. Be encouraging and practical.
Normal fasting range: 70-100 mg/dL. Normal post-meal (2hr): <140 mg/dL.
Elevated post-meal: 140-180 mg/dL. High: >180 mg/dL.`

const API_BASE = "https://generativelanguage.googleapis.com/v1beta"

async function callGemini(
  apiKey: string,
  parts: Array<Record<string, unknown>>,
  systemInstruction: string,
  temperature: number,
): Promise<string> {
  const response = await fetch(
    `${API_BASE}/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error")
    throw new Error(`Gemini API error (${response.status}): ${body}`)
  }

  const json = await response.json()
  const text: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text
  return text ?? ""
}

function stripToJson(text: string): string {
  let t = text.trim()
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  }
  const first = t.indexOf("{")
  const last = t.lastIndexOf("}")
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1)
  }
  return t.trim()
}

export async function analyzeMealAction(payload: {
  description?: string
  imageUrl?: string
  imageMimeType?: string
}): Promise<AnalyzeResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: "Server is missing GEMINI_API_KEY. Add it to your environment variables to enable analysis.",
    }
  }

  const description = payload.description?.trim() ?? ""
  const hasImage = !!payload.imageUrl

  if (!description && !hasImage) {
    return { ok: false, error: "Please provide a meal description or upload a photo." }
  }

  try {
    const parts: Array<Record<string, unknown>> = []

    if (description && hasImage) {
      parts.push({ text: `Analyze the meal shown in the attached image. Use this description from the user for additional context: "${description}".` })
    } else if (description) {
      parts.push({ text: `Analyze this meal: "${description}".` })
    } else {
      parts.push({ text: "Analyze the meal shown in the attached image." })
    }

    if (hasImage) {
      // Download the image from Vercel Blob and convert to base64 for Gemini
      const imageResp = await fetch(payload.imageUrl!)
      if (!imageResp.ok) {
        return { ok: false, error: "Failed to fetch uploaded image." }
      }
      const imageBuffer = Buffer.from(await imageResp.arrayBuffer())
      const base64 = imageBuffer.toString("base64")

      parts.push({
        inlineData: {
          mimeType: payload.imageMimeType || "image/jpeg",
          data: base64,
        },
      })
    }

    const raw = await callGemini(apiKey, parts, MEAL_SYSTEM_INSTRUCTION, 0.2)

    if (!raw) {
      return { ok: false, error: "The AI returned an empty response. Please try again." }
    }

    let parsed: MealAnalysis
    try {
      parsed = JSON.parse(stripToJson(raw)) as MealAnalysis
    } catch {
      return { ok: false, error: "Could not parse the AI response. Please try again." }
    }

    const data: MealAnalysis = {
      meal_name: String(parsed.meal_name ?? "Unknown meal"),
      total_calories: Number(parsed.total_calories) || 0,
      total_net_carbs_g: Number(parsed.total_net_carbs_g) || 0,
      total_protein_g: Number(parsed.total_protein_g) || 0,
      total_fat_g: Number(parsed.total_fat_g) || 0,
      glycemic_load: (["Low", "Medium", "High"].includes(parsed.glycemic_load)
        ? parsed.glycemic_load
        : "Medium") as MealAnalysis["glycemic_load"],
      clinical_note: String(parsed.clinical_note ?? ""),
      brand_or_restaurant: String(parsed.brand_or_restaurant ?? "").trim(),
      suggested_google_search_query: String(parsed.suggested_google_search_query ?? "").trim(),
    }

    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during analysis."
    return { ok: false, error: message }
  }
}

export async function getGlucoseInsightAction(
  readings: { value: number; time: string; note: string }[],
  recentMeals: { name: string; time: string; carbs_g: number; glycemic_load: string }[],
): Promise<GlucoseInsightResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "Server is missing GEMINI_API_KEY." }
  }

  if (readings.length === 0) {
    return { ok: false, error: "No blood sugar readings to analyze." }
  }

  try {
    const readingsSummary = readings
      .map((r) => `${r.time} — ${r.value} mg/dL${r.note ? ` (${r.note})` : ""}`)
      .join("\n")

    const mealsSummary = recentMeals
      .map((m) => `${m.time} — ${m.name} (${m.carbs_g}g carbs, glycemic load: ${m.glycemic_load})`)
      .join("\n")

    const prompt = `Here is the user's blood sugar data for today:\n\nBlood Sugar Readings:\n${readingsSummary || "No readings logged yet."}\n\nMeals Consumed:\n${mealsSummary || "No meals logged."}\n\nProvide personalized diabetes management insights based on this data.`

    const raw = await callGemini(apiKey, [{ text: prompt }], GLUCOSE_SYSTEM_INSTRUCTION, 0.4)

    if (!raw) {
      return { ok: false, error: "AI returned an empty response." }
    }

    let parsed: GlucoseInsight
    try {
      parsed = JSON.parse(stripToJson(raw)) as GlucoseInsight
    } catch {
      return { ok: false, error: "Could not parse the AI response." }
    }

    const data: GlucoseInsight = {
      trend_summary: String(parsed.trend_summary ?? ""),
      tips: Array.isArray(parsed.tips) ? parsed.tips.filter(Boolean) : [],
      concern_level: (["Good", "Caution", "Elevated"].includes(parsed.concern_level)
        ? parsed.concern_level
        : "Good") as GlucoseInsight["concern_level"],
    }

    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error."
    return { ok: false, error: message }
  }
}
