import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MealAnalysis } from "@/app/actions"

const STYLES: Record<MealAnalysis["glycemic_load"], string> = {
  Low: "bg-[#e7efe0] text-[#42583a] border-[#c9d8bd]",
  Medium: "bg-[#f6e8d1] text-[#8a5a1f] border-[#e6cfa2]",
  High: "bg-[#f3ddd3] text-[#8f3f28] border-[#e2b6a5]",
}

export function GlycemicBadge({
  level,
  className,
}: {
  level: MealAnalysis["glycemic_load"]
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        STYLES[level],
        className,
      )}
    >
      <Activity className="h-4 w-4" aria-hidden="true" />
      {level} Glycemic Load
    </span>
  )
}
