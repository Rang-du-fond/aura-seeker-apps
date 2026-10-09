import { SmartphoneIcon } from "lucide-react"
import { Link, NavLink } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { ModeToggle } from "@workspace/ui/components/mode-toggle"
import { cn } from "@workspace/ui/lib/utils"

import { LanguageToggle } from "@/components/language-toggle"
import { Logo } from "@/components/logo"
import type { MessageKey } from "@/lib/i18n"
import { useT } from "@/lib/language"

const navigation: { to: string; label: MessageKey }[] = [
  { to: "/", label: "header.home" },
  { to: "/map", label: "header.map" },
]

export function SiteHeader() {
  const t = useT()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-background px-[clamp(1rem,4vw,3rem)] py-3.5">
      <Link
        to="/"
        aria-label={t("header.homeLabel")}
        className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <Logo />
      </Link>
      <nav
        aria-label={t("header.navigation")}
        className="flex flex-wrap items-center gap-1"
      >
        {navigation.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-11 items-center border-b-3 border-transparent px-4 text-base font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
                isActive && "border-aura-blue font-bold"
              )
            }
          >
            {t(label)}
          </NavLink>
        ))}
        <Button asChild className="ml-2">
          <a href="/#app">
            <SmartphoneIcon data-icon="inline-start" />
            {t("header.download")}
          </a>
        </Button>
        <LanguageToggle />
        <ModeToggle
          label={t("header.changeTheme")}
          labels={{
            light: t("header.themeLight"),
            dark: t("header.themeDark"),
            system: t("header.themeSystem"),
          }}
        />
      </nav>
    </header>
  )
}
