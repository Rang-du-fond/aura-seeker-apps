import * as React from "react"

import { api } from "@/lib/client"
import { useUser } from "@/lib/session"

// The signs the user likes. The API does not say on a sign whether it is
// liked, nor by how many people: the user's likes are read once as a list
// (GET /places?liked_by=) and kept here.
const Context = React.createContext<{
  isLiked: (id: string) => boolean
  // Likes or unlikes on the server; the heart changes at once and goes back
  // if the request fails.
  toggle: (id: string) => Promise<void>
} | null>(null)

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const [liked, setLiked] = React.useState<ReadonlySet<string>>(new Set())

  React.useEffect(() => {
    let cancelled = false
    api
      .places({ likedBy: user.id })
      .then(
        (places) =>
          !cancelled && setLiked(new Set(places.map((place) => place.id)))
      )
      // Without the list every heart starts empty; liking still works.
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [user.id])

  const value = React.useMemo(() => {
    const set = (id: string, on: boolean) =>
      setLiked((current) => {
        const next = new Set(current)
        if (on) {
          next.add(id)
        } else {
          next.delete(id)
        }

        return next
      })

    return {
      isLiked: (id: string) => liked.has(id),
      async toggle(id: string) {
        const like = !liked.has(id)
        set(id, like)
        try {
          await (like ? api.like(id) : api.unlike(id))
        } catch {
          set(id, !like)
        }
      },
    }
  }, [liked])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useLikes() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error("useLikes must be used within a LikesProvider")
  }

  return context
}
