import { LanguagesIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { languages, type Language } from "@/lib/i18n"
import { useLanguage, useT } from "@/lib/language"

// Menu of the site's languages, each under its own name.
export function LanguageToggle() {
  const t = useT()
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("header.changeLanguage")}
        >
          <LanguagesIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
        >
          {(Object.keys(languages) as Language[]).map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {languages[code].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
