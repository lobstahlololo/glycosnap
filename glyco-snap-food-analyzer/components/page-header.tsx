import { cn } from "@/lib/utils"

/**
 * PageHeader — eyebrow label, big serif title, hand-drawn rule,
 * and an optional description paragraph.
 *
 * Used at the top of every dashboard page so each route has a consistent
 * "what is this page about" intro that sits above the gamification pills.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <header className={cn("mx-auto max-w-5xl px-4 pt-6 pb-1 sm:pt-8", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <hr className="recipe-rule my-4 max-w-24" />
      {description ? (
        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  )
}
