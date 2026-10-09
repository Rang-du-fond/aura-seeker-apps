import * as React from "react"
import { useColorScheme } from "react-native"

import { createTranslator } from "@workspace/ui/lib/i18n"
import { ThemeProvider } from "@workspace/ui/native/theme"

import { languages, matchLanguage, reference, type Language } from "@/lib/i18n"
import { readItem, writeItem } from "@/lib/storage"

const storageKey = "preferences"

export type { Language }
export type ThemeChoice = "system" | "light" | "dark"

type Preferences = { language: Language; theme: ThemeChoice }

// The device's language when the app has it, French otherwise.
function deviceLanguage(): Language {
  return matchLanguage([Intl.DateTimeFormat().resolvedOptions().locale])
}

const Context = React.createContext<
  | (Preferences & {
      setLanguage: (language: Language) => void
      setTheme: (theme: ThemeChoice) => void
    })
  | null
>(null)

// The user's language and theme, kept on the device, and the theme applied to
// everything below.
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] = React.useState<Preferences>(() => ({
    language: deviceLanguage(),
    theme: "system",
  }))
  const [ready, setReady] = React.useState(false)
  const system = useColorScheme()

  React.useEffect(() => {
    let cancelled = false
    readItem(storageKey)
      .then((stored) => {
        if (stored && !cancelled) {
          setPreferences((current) => ({ ...current, ...JSON.parse(stored) }))
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setReady(true))

    return () => {
      cancelled = true
    }
  }, [])

  const value = React.useMemo(() => {
    const change = (changes: Partial<Preferences>) =>
      setPreferences((current) => {
        const next = { ...current, ...changes }
        writeItem(storageKey, JSON.stringify(next)).catch(() => {})

        return next
      })

    return {
      ...preferences,
      setLanguage: (language: Language) => change({ language }),
      setTheme: (theme: ThemeChoice) => change({ theme }),
    }
  }, [preferences])

  // Wait for the stored choice, so the app never flashes the wrong theme.
  if (!ready) {
    return null
  }

  const scheme =
    preferences.theme === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preferences.theme

  return (
    <Context.Provider value={value}>
      <ThemeProvider scheme={scheme}>{children}</ThemeProvider>
    </Context.Provider>
  )
}

export function usePreferences() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider")
  }

  return context
}

// Translation: `t("signs.hello", { name })` returns the text of that key in
// the user's language (see lib/i18n and the catalogs next to it). A counted
// text takes `count`: `t("common.signCount", { count })`.
export function useT() {
  const { language } = usePreferences()

  return React.useMemo(() => {
    const { messages, locale } = languages[language]

    return createTranslator(messages, reference, locale)
  }, [language])
}

// BCP 47 tag for dates and numbers.
export function useLocale() {
  return languages[usePreferences().language].locale
}
