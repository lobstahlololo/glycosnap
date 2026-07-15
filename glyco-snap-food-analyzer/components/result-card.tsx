import { BadgeCheck, Beef, Droplet, Flame, Info, Wheat } from "lucide-react"
import type { MealAnalysis } from "@/app/actions"
import { GlycemicBadge } from "@/components/glycemic-badge"
import { MetricRing } from "@/components/metric-ring"

export function ResultCard({ data }: { data: MealAnalysis }) {
  return (
    <section
      aria-live="polite"
      className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]"
    >
      {/* Image preview — Cloudinary converts HEIC to JPEG for browser viewing */}
      {data.preview_image_url ? (
        <div className="mb-5 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.preview_image_url}
            alt={data.meal_name}
            className="max-h-64 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Latest analysis</p>
          <h2 className="text-balance font-serif text-2xl font-semibold text-card-foreground">
            {data.meal_name}
          </h2>
          {data.brand_or_restaurant ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {data.brand_or_restaurant}
              </span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  data.suggested_google_search_query || `${data.brand_or_restaurant} ${data.meal_name} nutrition facts`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Verify on Google 🌐
              </a>
            </div>
          ) : null}
        </div>
        <GlycemicBadge level={data.glycemic_load} />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
        <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="text-sm text-secondary-foreground">Estimated energy</span>
        <span className="ml-auto text-xl font-semibold tabular-nums text-secondary-foreground">
          {Math.round(data.total_calories)} kcal
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <MetricRing
          label="Net Carbs"
          value={data.total_net_carbs_g}
          unit="g"
          max={80}
          color="oklch(0.605 0.128 42)"
          icon={<Wheat className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricRing
          label="Protein"
          value={data.total_protein_g}
          unit="g"
          max={60}
          color="oklch(0.58 0.08 150)"
          icon={<Beef className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricRing
          label="Fat"
          value={data.total_fat_g}
          unit="g"
          max={60}
          color="oklch(0.72 0.12 75)"
          icon={<Droplet className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      {data.clinical_note ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-accent-foreground/20 bg-accent p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-accent-foreground">Clinical note</p>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-accent-foreground">
              {data.clinical_note}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
