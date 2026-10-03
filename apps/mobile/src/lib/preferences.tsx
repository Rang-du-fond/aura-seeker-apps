import * as React from "react"
import { useColorScheme } from "react-native"

import { ThemeProvider } from "@workspace/ui/native/theme"

import { en } from "@/lib/i18n/en"
import { readItem, writeItem } from "@/lib/storage"

const storageKey = "preferences"

export type Language = "fr" | "en"
export type ThemeChoice = "system" | "light" | "dark"

type Preferences = { language: Language; theme: ThemeChoice }

// French unless the device is set to English.
function deviceLanguage(): Language {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  return locale.toLowerCase().startsWith("en") ? "en" : "fr"
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

// Translation: the French text is the key. `t("Modifier {title}", { title })`
// returns it as it is in French, and its entry in i18n/en.ts in English. A
// text missing from en.ts falls back to French.
export function useT() {
  const { language } = usePreferences()

  return React.useCallback(
    (text: string, values?: Record<string, string | number>) => {
      const template =
        language === "en"
          ? ((en as Record<string, string>)[text] ?? text)
          : text

      return values
        ? template.replace(/\{(\w+)\}/g, (_, name) =>
            String(values[name] ?? "")
          )
        : template
    },
    [language]
  )
}

// A counted text: `count(n, "{count} panneau", "{count} panneaux")`. French
// uses the plural from 2, English for everything but 1.
export function useCount() {
  const { language } = usePreferences()
  const t = useT()

  return React.useCallback(
    (count: number, one: string, many: string) =>
      t((language === "en" ? count !== 1 : count > 1) ? many : one, { count }),
    [language, t]
  )
}

// BCP 47 tag for dates and numbers.
export function useLocale() {
  return usePreferences().language === "en" ? "en-GB" : "fr-FR"
}
