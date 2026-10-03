import { logoGlyphs } from "@workspace/ui/lib/logo-glyphs"
import { cn } from "@workspace/ui/lib/utils"

import { heroPatternColumns } from "@/components/hero-pattern-data"

export function HeroPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
      fill="currentColor"
      className={cn("hero-pattern absolute inset-0 size-full", className)}
    >
      {heroPatternColumns.map(({ delay, items }) => (
        <g key={delay} style={{ animationDelay: `${delay}s` }}>
          {items.map(({ glyph, transform }) => (
            <path key={transform} d={logoGlyphs[glyph]} transform={transform} />
          ))}
        </g>
      ))}
    </svg>
  )
}
