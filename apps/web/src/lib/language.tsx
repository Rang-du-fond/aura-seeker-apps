import * as React from "react"

import { createTranslator } from "@workspace/ui/lib/i18n"

import { languages, matchLanguage, reference, type Language } from "@/lib/i18n"

const storageKey = "language"

// The stored choice, else the browser's language when the site has it.
function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && stored in languages) {
      return stored as Language
    }
  } catch {
    // Storage is blocked: fall through to the browser's language.
  }

  return matchLanguage(navigator.languages ?? [navigator.language])
}

const Context = React.createContext<{
  language: Language
  setLanguage: (language: Language) => void
} | null>(null)

// The site's language: kept in localStorage and set on <html lang>.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState(initialLanguage)

  React.useEffect(() => {
    document.documentElement.lang = language
    document.title = createTranslator(
      languages[language].messages,
      reference,
      languages[language].locale
    )("meta.title")
    try {
      localStorage.setItem(storageKey, language)
    } catch {
      // The choice then lasts for this visit only.
    }
  }, [language])

  const value = React.useMemo(() => ({ language, setLanguage }), [language])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useLanguage() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}

// Translation: `t("map.removeTag", { tag })` returns the text of that key in
// the site's language (see lib/i18n and the catalogs next to it). A counted
// text takes `count`: `t("map.resultCount", { count })`.
export function useT() {
  const { language } = useLanguage()

  return React.useMemo(() => {
    const { messages, locale } = languages[language]

    return createTranslator(messages, reference, locale)
  }, [language])
}

// BCP 47 tag for dates and numbers.
export function useLocale() {
  return languages[useLanguage().language].locale
}
