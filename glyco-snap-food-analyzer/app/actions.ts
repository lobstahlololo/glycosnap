"use server"

import { GoogleGenAI } from "@google/genai"

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

const SYSTEM_INSTRUCTION = `You are a clinical diabetes tracking assistant used inside a medical-grade nutrition app.
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

function stripToJson(text: string): string {
  let t = text.trim()
  // Remove markdown code fences if the model added them anyway.
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  }
  // Extract the outermost JSON object if there is surrounding text.
  const first = t.indexOf("{")
  const last = t.lastIndexOf("}")
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1)
  }
  return t.trim()
}

export async function analyzeMealAction(formData: FormData): Promise<AnalyzeResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: "Server is missing GEMINI_API_KEY. Add it to your environment variables to enable analysis.",
    }
  }

  const description = (formData.get("description") as string | null)?.trim() ?? ""
  const image = formData.get("image") as File | null
  const hasImage = image && typeof image.size === "number" && image.size > 0

  if (!description && !hasImage) {
    return { ok: false, error: "Please provide a meal description or upload a photo." }
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const parts: Array<Record<string, unknown>> = []

    let textPrompt: string
    if (description && hasImage) {
      textPrompt = `Analyze the meal shown in the attached image. Use this description from the user for additional context: "${description}".`
    } else if (description) {
      textPrompt = `Analyze this meal: "${description}".`
    } else {
      textPrompt = "Analyze the meal shown in the attached image."
    }
    parts.push({ text: textPrompt })

    if (hasImage) {
      const bytes = Buffer.from(await image!.arrayBuffer())
      const base64 = bytes.toString("base64")
      parts.push({
        inlineData: {
          mimeType: image!.type || "image/jpeg",
          data: base64,
        },
      })
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    })

    const raw = response.text ?? ""
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
