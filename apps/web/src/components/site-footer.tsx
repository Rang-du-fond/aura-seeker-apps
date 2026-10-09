import { Link } from "react-router"

import type { MessageKey } from "@/lib/i18n"
import { useT } from "@/lib/language"

const legalLinks: { to: string; label: MessageKey }[] = [
  { to: "/legal", label: "footer.legal" },
  { to: "/accessibility", label: "footer.accessibility" },
  { to: "/privacy", label: "footer.personalData" },
]

export function SiteFooter() {
  const t = useT()

  return (
    <footer className="surface-slate px-[clamp(1rem,4vw,3rem)] pt-12 pb-8">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 text-sm leading-relaxed">
        <div className="col-span-full sm:col-span-2">
          <strong className="block text-[15px]">
            {t("footer.aboutTitle")}
          </strong>
          {t("footer.aboutText")}
        </div>
        <div className="flex flex-col gap-1">
          {legalLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="text-link underline">
              {t(label)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
