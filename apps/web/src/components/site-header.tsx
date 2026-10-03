import { SmartphoneIcon } from "lucide-react"
import { Link, NavLink } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { ModeToggle } from "@workspace/ui/components/mode-toggle"
import { cn } from "@workspace/ui/lib/utils"

import { Logo } from "@/components/logo"

const navigation = [
  { to: "/", label: "Accueil" },
  { to: "/map", label: "Carte des panneaux" },
]

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-background px-[clamp(1rem,4vw,3rem)] py-3.5">
      <Link
        to="/"
        aria-label="Accueil — La Région Auvergne-Rhône-Alpes"
        className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <Logo />
      </Link>
      <nav
        aria-label="Navigation principale"
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
            {label}
          </NavLink>
        ))}
        <Button asChild className="ml-2">
          <a href="/#app">
            <SmartphoneIcon data-icon="inline-start" />
            Télécharger l'app
          </a>
        </Button>
        <ModeToggle label="Changer de thème" labels={themeLabels} />
      </nav>
    </header>
  )
}

const themeLabels = { light: "Clair", dark: "Sombre", system: "Système" }
