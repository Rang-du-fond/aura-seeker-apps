import type { MessageKey as KeyOf } from "@workspace/ui/lib/i18n"

import en from "./en.json"
import fr from "./fr.json"

// French is the reference: its catalog defines the keys, and a text missing
// from another language is shown in French.
export const reference = fr

type Messages = typeof fr

// To add a language: copy fr.json, translate it, and add an entry here. The
// `Messages` type makes a missing key a type error.
export const languages = {
  fr: { label: "Français", locale: "fr-FR", messages: fr },
  en: { label: "English", locale: "en-GB", messages: en },
} satisfies Record<
  string,
  // `label` is the language's own name, shown in the header menu; `locale` is
  // the BCP 47 tag used for dates, numbers and plural rules.
  { label: string; locale: string; messages: Messages }
>

export type Language = keyof typeof languages

export const defaultLanguage: Language = "fr"

// Every key of the catalogs: `t` only accepts these.
export type MessageKey = KeyOf<Messages>

// The language to start with: the first of `preferred` (BCP 47 tags, best
// first) that the app has, French otherwise.
export function matchLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const code = tag.toLowerCase().split("-")[0]
    if (code in languages) {
      return code as Language
    }
  }

  return defaultLanguage
}
