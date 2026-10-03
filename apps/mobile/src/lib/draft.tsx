import * as React from "react"

// The sign being added: filled on the capture screen, read by the form.
export type Draft = {
  photoUri: string | null
  position: {
    latitude: number
    longitude: number
    // Metres, when the device reports it.
    accuracy: number | null
  } | null
  // True once the user has placed the position by hand: GPS updates are
  // ignored from then on.
  adjusted: boolean
}

const empty: Draft = { photoUri: null, position: null, adjusted: false }

const Context = React.createContext<{
  draft: Draft
  update: (changes: Partial<Draft>) => void
  // A position coming from the GPS; dropped once the user has adjusted it.
  locate: (position: NonNullable<Draft["position"]>) => void
  reset: () => void
} | null>(null)

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = React.useState(empty)
  const value = React.useMemo(
    () => ({
      draft,
      update: (changes: Partial<Draft>) =>
        setDraft((current) => ({ ...current, ...changes })),
      locate: (position: NonNullable<Draft["position"]>) =>
        setDraft((current) =>
          current.adjusted ? current : { ...current, position }
        ),
      reset: () => setDraft(empty),
    }),
    [draft]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDraft() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error("useDraft must be used within a DraftProvider")
  }

  return context
}

export function formatCoordinates(point: {
  latitude: number
  longitude: number
}) {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(4).replace(".", ",")}° ${value >= 0 ? positive : negative}`

  return `${part(point.latitude, "N", "S")} · ${part(point.longitude, "E", "O")}`
}
