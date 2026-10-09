import type { MessageKey } from "@/lib/i18n"
import { useT } from "@/lib/language"

const legalLinks: MessageKey[] = [
  "footer.legal",
  "footer.accessibility",
  "footer.personalData",
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
        {/* TODO: point these at the legal pages once they exist. */}
        <div className="flex flex-col gap-1">
          {legalLinks.map((label) => (
            <a key={label} href="#" className="text-link underline">
              {t(label)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
