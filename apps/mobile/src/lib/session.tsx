import * as React from "react"

import { ApiError, type Tokens, type User } from "@/lib/api"
import { api } from "@/lib/client"
import { getGoogleIdToken, GoogleError } from "@/lib/google"
import { getPasskey, PasskeyError } from "@/lib/passkeys"
import { readItem, removeItem, writeItem } from "@/lib/storage"

const storageKey = "session"
// Renew the access token this long before it expires.
const renewMargin = 60_000

export type Session = {
  accessToken: string
  // Epoch milliseconds.
  accessExpiresAt: number
  // Single use: replaced at each refresh.
  refreshToken: string
  user: User
  displayName: string | null
}

type SessionContext = {
  // False while the stored session is being read at launch.
  ready: boolean
  session: Session | null
  // True after the server ended the session, until the next sign-in.
  expired: boolean
  // Both answer with the id of an emailed code when the address has to be
  // confirmed first (always for a signup); `verify` then signs in.
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string>
  // `displayName` is saved to the profile of a newly created account.
  verify: (
    challengeId: string,
    code: string,
    displayName?: string
  ) => Promise<void>
  // Shows the native Google dialog and signs in with the chosen account.
  // Throws a GoogleError when there is no dialog or the user cancels.
  signInWithGoogle: () => Promise<void>
  // Asks the device for a passkey and signs in with it. Throws a
  // PasskeyError when the device has none or the user cancels.
  signInWithPasskey: () => Promise<void>
  signOut: () => Promise<void>
  // Signs out of every device, this one included.
  signOutEverywhere: () => Promise<void>
  // After the server has changed the account's email.
  setEmail: (email: string) => Promise<void>
}

const Context = React.createContext<SessionContext | null>(null)

function fromTokens(tokens: Tokens, displayName: string | null): Session {
  return {
    accessToken: tokens.access_token,
    accessExpiresAt: Date.now() + tokens.expires_in * 1000,
    refreshToken: tokens.refresh_token,
    user: tokens.user,
    displayName,
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [session, setSession] = React.useState<Session | null>(null)
  const [expired, setExpired] = React.useState(false)
  // The API client reads the session outside of rendering, through this ref.
  const sessionRef = React.useRef<Session | null>(null)
  const renewing = React.useRef<Promise<string | null> | null>(null)

  const store = React.useCallback(async (next: Session) => {
    sessionRef.current = next
    setSession(next)
    await writeItem(storageKey, JSON.stringify(next))
  }, [])

  const end = React.useCallback(async (reason: "signedOut" | "expired") => {
    sessionRef.current = null
    setSession(null)
    setExpired(reason === "expired")
    await removeItem(storageKey)
  }, [])

  // Trades the refresh token for new tokens. One exchange at a time: the
  // refresh token is single use, so concurrent requests share the same one.
  const renew = React.useCallback(() => {
    renewing.current ??= (async () => {
      const current = sessionRef.current
      if (!current) {
        return null
      }
      try {
        const tokens = await api.refresh(current.refreshToken)
        await store(fromTokens(tokens, current.displayName))

        return tokens.access_token
      } catch (error) {
        // Offline: keep the session and let the request fail on its own.
        if (error instanceof ApiError && error.code === "network") {
          throw error
        }
        await end("expired")

        return null
      } finally {
        renewing.current = null
      }
    })()

    return renewing.current
  }, [store, end])

  React.useEffect(() => {
    api.setTokenSource({
      current: async () => {
        const current = sessionRef.current
        if (!current) {
          return null
        }

        return current.accessExpiresAt - Date.now() < renewMargin
          ? renew()
          : current.accessToken
      },
      renewed: renew,
    })

    return () => api.setTokenSource(null)
  }, [renew])

  // Restore the stored session at launch. Its access token is renewed by the
  // first request if it has expired in the meantime.
  React.useEffect(() => {
    let cancelled = false
    readItem(storageKey)
      .then((stored) => {
        const restored: Session | null = stored ? JSON.parse(stored) : null
        // Sessions stored before refresh tokens existed cannot be renewed.
        if (!cancelled && restored?.refreshToken) {
          sessionRef.current = restored
          setSession(restored)
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setReady(true))

    return () => {
      cancelled = true
    }
  }, [])

  // Starts the session, then settles the display name: saved when one is
  // given (a new account), read from the profile otherwise. The name is
  // cosmetic, so a failure there does not fail the sign-in.
  const open = React.useCallback(
    async (tokens: Tokens, displayName?: string) => {
      await store(fromTokens(tokens, null))
      setExpired(false)
      const profile = await (
        displayName
          ? api.updateProfile(tokens.user.id, displayName)
          : api.profile(tokens.user.id)
      ).catch(() => null)
      if (profile?.display_name) {
        await store(fromTokens(tokens, profile.display_name))
      }
    },
    [store]
  )

  const value = React.useMemo<SessionContext>(
    () => ({
      ready,
      session,
      expired,

      async signIn(email, password) {
        let tokens: Tokens
        try {
          tokens = await api.login(email, password)
        } catch (error) {
          // The address is not confirmed yet: a code was just emailed.
          if (error instanceof ApiError && error.challengeId) {
            return error.challengeId
          }
          throw error
        }
        await open(tokens)

        return null
      },

      async signUp(email, password) {
        return (await api.signup(email, password)).challenge_id
      },

      async verify(challengeId, code, displayName) {
        const tokens = await api.verifyEmail(challengeId, code)
        await open(tokens, displayName)
      },

      async signOutEverywhere() {
        // Unlike a plain sign-out, this must reach the server to mean
        // anything: on failure the session is kept and the error is thrown.
        await api.logoutAll()
        await end("signedOut")
      },

      async setEmail(email) {
        const current = sessionRef.current
        if (current) {
          await store({ ...current, user: { ...current.user, email } })
        }
      },

      async signInWithGoogle() {
        const { nonce } = await api.googleNonce()
        const idToken = await getGoogleIdToken(nonce)
        await open(await api.googleLogin(idToken, nonce))
      },

      async signInWithPasskey() {
        const { options, blob } = await api.startPasskeyLogin()
        const credential = await getPasskey(options.publicKey)
        await open(await api.finishPasskeyLogin(blob, credential))
      },

      async signOut() {
        // Best effort: the device is signed out even if the server isn't told.
        await api.logout().catch(() => {})
        await end("signedOut")
      },
    }),
    [ready, session, expired, store, end, open]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }

  return context
}

// For screens behind the sign-in: the (app) layout guarantees a session.
export function useUser() {
  const { session } = useSession()
  if (!session) {
    throw new Error("useUser must be used on a signed-in screen")
  }
  const name = session.displayName?.trim() || session.user.email.split("@")[0]
  const words = name.split(/\s+/)

  return {
    ...session.user,
    name,
    firstName: words[0],
    initials: (words.length > 1
      ? words[0][0] + words[words.length - 1][0]
      : name.slice(0, 2)
    ).toUpperCase(),
  }
}

// French text for the error codes the auth screens can meet.
export function authErrorMessage(error: unknown) {
  if (error instanceof GoogleError) {
    return error.code === "unsupported"
      ? "La connexion avec Google n'est pas disponible sur cet appareil."
      : error.code === "cancelled"
        ? "La connexion avec Google a été annulée."
        : "La connexion avec Google a échoué. Réessayez."
  }
  if (error instanceof PasskeyError) {
    return error.code === "unsupported"
      ? "Les clés d'accès ne sont pas disponibles sur cet appareil."
      : error.code === "cancelled"
        ? "Aucune clé d'accès n'a été utilisée."
        : "La clé d'accès n'a pas pu être utilisée. Réessayez."
  }
  const code = error instanceof ApiError ? error.code : ""
  switch (code) {
    case "invalid_credentials":
      return "Adresse e-mail ou mot de passe incorrect."
    case "invalid_password":
      return "Le mot de passe doit contenir entre 12 et 128 caractères."
    case "breached_password":
      return "Ce mot de passe figure dans des fuites de données. Choisissez-en un autre."
    case "invalid_id_token":
      return "Google n'a pas pu confirmer votre identité. Réessayez."
    case "provider_email_unverified":
      return "L'adresse e-mail de ce compte Google n'est pas vérifiée."
    case "provider_email_mismatch":
      return "Ce compte Google n'a pas la même adresse e-mail que votre compte."
    case "identity_already_linked":
      return "Ce compte Google est déjà relié à un autre compte."
    case "last_login_method":
      return "C'est votre seule méthode de connexion : ajoutez-en une autre avant de la retirer."
    case "invalid_passkey":
      return "Cette clé d'accès n'est pas reconnue."
    case "step_up_required":
      return "Par sécurité, reconnectez-vous puis réessayez."
    case "invalid_code":
      return "Ce code est incorrect."
    case "challenge_expired":
    case "too_many_attempts":
      return "Ce code n'est plus valable. Demandez-en un nouveau."
    case "rate_limited":
      return "Trop de tentatives. Réessayez dans quelques minutes."
    case "network":
      return "Impossible de joindre le serveur. Vérifiez votre connexion."
    default:
      return "Une erreur est survenue. Réessayez dans un instant."
  }
}
