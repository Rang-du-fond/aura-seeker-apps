// Client for the Aura Seeker API (see ../../../../../api-rust/openapi.json).
// No React Native imports here, so it can be exercised outside the app.

export type User = { id: string; email: string }

export type Tokens = {
  access_token: string
  token_type: string
  // Seconds until the access token expires (15 minutes).
  expires_in: number
  // Single use: each refresh returns a new one.
  refresh_token: string
  refresh_expires_in: number
  user: User
}

// A sign ("place" in the API).
export type Place = {
  id: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  image: string
  tags: string[]
  created_at: string
  author: string
}

export type TagUsage = { name: string; places: number }

// One way to sign in to an account. `provider` is "password", "google"…
export type LinkedIdentity = {
  id: string
  provider: string
  email: string | null
}

// A device the user is signed in on. Times are epoch seconds.
export type ActiveSession = {
  id: string
  device_label: string | null
  signed_in_at: number
  last_used_at: number
  // True for the device making the request.
  current: boolean
}

// One step of a passkey ceremony: WebAuthn options under `publicKey`, and
// the state to send back with the device's answer.
export type Ceremony = {
  options: { publicKey: Record<string, unknown> }
  blob: string
}

export type Passkey = {
  id: string
  label: string | null
  // Epoch seconds.
  created_at: number
  last_used_at: number | null
}

// A code has been emailed: it is confirmed with this id.
export type Challenge = { challenge_id: string }

export type PlaceSearch = {
  authorId?: string
  // Only the signs this user likes.
  likedBy?: string
  // Text the title must contain.
  title?: string
  // Exact name of a tag the sign must carry.
  tag?: string
  area?: { latitude: number; longitude: number; radius: number }
}

// `code` is the API's stable error code ("invalid_credentials", …), or
// "network" when the server could not be reached.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    // Set on "email_unverified": the code just emailed belongs to it.
    readonly challengeId: string | null = null
  ) {
    super(message)
  }
}

// Where authenticated requests get their access token. `current` returns the
// token to use now; `renewed` is asked for a fresh one after a 401. Both
// answer null when there is no session any more.
export type TokenSource = {
  current: () => Promise<string | null>
  renewed: () => Promise<string | null>
}

type RequestOptions = {
  body?: unknown
  method?: string
  // Send `body` as it is, with this media type, instead of as JSON.
  rawType?: string
  // Public routes (login, signup, refresh) are sent without a token.
  anonymous?: boolean
}

export function createApi(baseUrl: string) {
  let tokens: TokenSource | null = null

  async function send(
    path: string,
    options: RequestOptions,
    token: string | null
  ) {
    const { body, method, rawType } = options
    try {
      return await fetch(`${baseUrl}${path}`, {
        method: method ?? (body === undefined ? "GET" : "POST"),
        headers: {
          ...(body !== undefined && {
            "Content-Type": rawType ?? "application/json",
          }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body:
          body === undefined
            ? undefined
            : rawType
              ? (body as Blob | ArrayBuffer)
              : JSON.stringify(body),
      })
    } catch {
      throw new ApiError(0, "network", "The server could not be reached")
    }
  }

  async function request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const authenticated = !options.anonymous
    let response = await send(
      path,
      options,
      authenticated ? ((await tokens?.current()) ?? null) : null
    )
    // The access token may have just expired or been revoked: renew it once.
    if (response.status === 401 && authenticated && tokens) {
      const renewed = await tokens.renewed()
      if (renewed) {
        response = await send(path, options, renewed)
      }
    }

    if (!response.ok) {
      // Auth routes answer {error, message}; the others, problem+json.
      const problem = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        problem.error ?? String(response.status),
        problem.message ?? problem.detail ?? response.statusText,
        problem.challenge_id ?? null
      )
    }

    // Some routes answer with no body (202, 204).
    const text = await response.text()

    return (text ? JSON.parse(text) : undefined) as T
  }

  const collection = <T>(path: string) =>
    request<{ _embedded: Record<string, T[]> }>(path).then((body) =>
      Object.values(body._embedded).flat()
    )

  return {
    // Set by the session once signed in, cleared on sign-out.
    setTokenSource(source: TokenSource | null) {
      tokens = source
    },

    // Fails with 403 "email_unverified" (and a `challengeId`) while the
    // address is not confirmed: a code has been emailed, see verifyEmail.
    login: (email: string, password: string) =>
      request<Tokens>("/auth/password/login", {
        anonymous: true,
        body: { email, password },
      }),

    // Emails a 6-digit code to confirm the address. The answer is the same
    // whether the account was created or the email was already registered.
    signup: (email: string, password: string) =>
      request<Challenge>("/auth/password/signup", {
        anonymous: true,
        body: { email, password },
      }),

    // Emails a new code to log in with, whatever the state of the account.
    startEmailLogin: (email: string) =>
      request<Challenge>("/auth/email/start", {
        anonymous: true,
        body: { email },
      }),

    // Exchanges an emailed code for tokens. Fails with "invalid_code",
    // "challenge_expired" or "too_many_attempts".
    verifyEmail: (challengeId: string, code: string) =>
      request<Tokens>("/auth/email/verify", {
        anonymous: true,
        body: { challenge_id: challengeId, code },
      }),

    // Emails a code to reset the password, if the address has an account.
    startPasswordReset: (email: string) =>
      request<Challenge>("/auth/password/reset/start", {
        anonymous: true,
        body: { email },
      }),

    // Sets the new password and signs every device out; log in afterwards.
    completePasswordReset: (
      challengeId: string,
      code: string,
      newPassword: string
    ) =>
      request<void>("/auth/password/reset/complete", {
        anonymous: true,
        body: {
          challenge_id: challengeId,
          code,
          new_password: newPassword,
        },
      }),

    // Google: a signed nonce, valid 5 minutes, to hand to the Google dialog…
    googleNonce: () =>
      request<{ nonce: string; expires_in: number }>("/auth/nonce", {
        anonymous: true,
      }),

    // …then the ID token the dialog returns, with that nonce. A first Google
    // login creates the account; an account already using the same email
    // gets Google added to it. Fails with "invalid_id_token" or
    // "provider_email_unverified".
    googleLogin: (idToken: string, nonce: string) =>
      request<Tokens>("/auth/google/token", {
        anonymous: true,
        body: { id_token: idToken, nonce },
      }),

    // Passkeys. Each ceremony is two calls: `start` gives the WebAuthn
    // options for the device and an opaque `blob`, `finish` takes the
    // device's answer with that blob.
    startPasskeyLogin: () =>
      request<Ceremony>("/auth/passkeys/login/start", {
        anonymous: true,
        method: "POST",
      }),

    // Fails with "invalid_passkey" or "challenge_expired".
    finishPasskeyLogin: (blob: string, credential: object) =>
      request<Tokens>("/auth/passkeys/login/finish", {
        anonymous: true,
        body: { blob, credential },
      }),

    // Adding or removing a passkey needs a login less than 10 minutes old:
    // otherwise these fail with 403 "step_up_required".
    startPasskeyRegistration: () =>
      request<Ceremony>("/auth/passkeys/register/start", { method: "POST" }),

    finishPasskeyRegistration: (
      blob: string,
      credential: object,
      label: string
    ) =>
      request<Passkey>("/auth/passkeys/register/finish", {
        body: { blob, credential, label },
      }),

    passkeys: () => request<Passkey[]>("/auth/passkeys"),

    deletePasskey: (id: string) =>
      request<void>(`/auth/passkeys/${id}`, { method: "DELETE" }),

    // The ways to sign in to the account: its password and its providers.
    identities: () => request<LinkedIdentity[]>("/auth/identities"),

    // Attaches the Google account of an ID token (see googleNonce) to the
    // signed-in user. Needs a login less than 10 minutes old (403
    // "step_up_required"); fails with 409 "provider_email_mismatch" when the
    // Google address is not the account's, or "identity_already_linked" when
    // that Google account belongs to another user.
    linkGoogle: (idToken: string, nonce: string) =>
      request<LinkedIdentity>("/auth/google/link", {
        method: "POST",
        body: { id_token: idToken, nonce },
      }),

    // Same recent-login rule; 409 "last_login_method" for the only one left.
    deleteIdentity: (id: string) =>
      request<void>(`/auth/identities/${id}`, { method: "DELETE" }),

    // Fails with 401 "invalid_refresh_token" when the session is over.
    refresh: (refreshToken: string) =>
      request<Tokens>("/auth/refresh", {
        anonymous: true,
        body: { refresh_token: refreshToken },
      }),

    logout: () => request<void>("/auth/logout", { method: "POST" }),

    // Signs every device out, this one included.
    logoutAll: () => request<void>("/auth/logout-all", { method: "POST" }),

    // The devices the user is signed in on.
    sessions: () => request<ActiveSession[]>("/auth/sessions"),

    deleteSession: (id: string) =>
      request<void>(`/auth/sessions/${id}`, { method: "DELETE" }),

    // The two account changes below follow authentication_spec.md (7. HTTP
    // API). The server does not implement them yet: until it does they fail
    // with 404, and the request bodies here are this client's reading of the
    // spec, to be checked against the real routes.
    changePassword: (currentPassword: string, newPassword: string) =>
      request<void>("/auth/password", {
        method: "PUT",
        body: { current_password: currentPassword, new_password: newPassword },
      }),

    // Sends a code to the new address; confirm it with verifyEmailChange.
    startEmailChange: (email: string) =>
      request<{ challenge_id: string }>("/auth/email/change", {
        body: { email },
      }),

    verifyEmailChange: (challengeId: string, code: string) =>
      request<void>("/auth/email/verify", {
        body: { challenge_id: challengeId, code },
      }),

    profile: (userId: string) =>
      request<{ display_name: string | null }>(`/users/${userId}`),

    updateProfile: (userId: string, displayName: string) =>
      request<{ display_name: string | null }>(`/users/${userId}`, {
        method: "PUT",
        body: { display_name: displayName },
      }),

    // Searches the signs that are not archived. With an `area` (a disc, radius
    // in metres) the nearest come first. The API has no rectangular view box
    // and no result limit.
    places: ({ authorId, likedBy, title, tag, area }: PlaceSearch = {}) => {
      const params = new URLSearchParams()
      if (authorId) params.set("author", authorId)
      if (likedBy) params.set("liked_by", likedBy)
      if (title) params.set("title", title)
      if (tag) params.set("tag", tag)
      if (area) {
        params.set("latitude", String(area.latitude))
        params.set("longitude", String(area.longitude))
        params.set("radius", String(Math.ceil(area.radius)))
      }
      const query = params.toString()

      return collection<Place>(query ? `/places?${query}` : "/places")
    },

    place: (id: string) => request<Place>(`/places/${id}`),

    // Likes a sign as the signed-in user. Fails with 403 on one's own sign.
    like: (id: string) =>
      request<void>(`/places/${id}/like`, { method: "PUT" }),

    unlike: (id: string) =>
      request<void>(`/places/${id}/like`, { method: "DELETE" }),

    // Tags whose name contains `query`, with the number of signs that carry
    // each.
    tags: (query: string) =>
      collection<TagUsage>(`/tags?q=${encodeURIComponent(query)}`),

    // Uploads a photo (20 MiB at most) and returns the file's id.
    uploadImage: (image: Blob | ArrayBuffer, type: string) =>
      request<{ id: string }>("/files", { body: image, rawType: type }).then(
        ({ id }) => id
      ),

    createPlace: (
      place: Pick<
        Place,
        "title" | "latitude" | "longitude" | "image" | "tags"
      > & { description?: string }
    ) => request<Place>("/places", { body: place }),

    // Replaces a sign; only its author may. Every field is sent, changed or not.
    updatePlace: ({
      id,
      ...body
    }: Pick<
      Place,
      | "id"
      | "title"
      | "description"
      | "latitude"
      | "longitude"
      | "image"
      | "tags"
    >) => request<Place>(`/places/${id}`, { method: "PUT", body }),

    // Archives a sign; only its author may. It leaves the map and the lists.
    deletePlace: (id: string) =>
      request<void>(`/places/${id}`, { method: "DELETE" }),

    // Photos are public: usable directly as an image source.
    imageUrl: (fileId: string) => `${baseUrl}/files/${fileId}/content`,

    signCount: (userId: string) =>
      request<{ total: number }>(`/places/statistics?author=${userId}`).then(
        ({ total }) => total
      ),
  }
}
