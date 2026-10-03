// Passkeys on phones, through the system's passkey dialog (the web build uses
// passkeys.ts).
//
// This needs a development build: the native module is not in Expo Go. It
// also needs the app to be associated with the API's domain (the WebAuthn
// `rp_id`): an apple-app-site-association file and `associatedDomains` on
// iOS, an assetlinks.json on Android. It cannot work against `localhost`.

export class PasskeyError extends Error {
  constructor(readonly code: "unsupported" | "cancelled" | "failed") {
    super(code)
  }
}

type Json = Record<string, unknown>

// Loaded on first use: importing the library where its native module is
// missing (Expo Go) must not break the app.
function library() {
  try {
    const { Passkey } =
      require("react-native-passkey") as typeof import("react-native-passkey")

    return Passkey.isSupported() ? Passkey : null
  } catch {
    return null
  }
}

export function passkeysSupported() {
  return library() !== null
}

async function run(kind: "create" | "get", publicKey: Json): Promise<Json> {
  const passkey = library()
  if (!passkey) {
    throw new PasskeyError("unsupported")
  }
  try {
    // The library takes and returns the same JSON as the WebAuthn API.
    return (await passkey[kind](publicKey as never)) as unknown as Json
  } catch (error) {
    const code = (error as { error?: string } | null)?.error
    // The system's own reason, for the development log: the message shown to
    // the user is deliberately short.
    console.warn(
      `Passkey ${kind} failed:`,
      code,
      (error as { message?: string } | null)?.message
    )
    throw new PasskeyError(
      code === "UserCancelled" || code === "NoCredentials"
        ? "cancelled"
        : code === "NotSupported"
          ? "unsupported"
          : "failed"
    )
  }
}

export const createPasskey = (publicKey: Json) => run("create", publicKey)

export const getPasskey = (publicKey: Json) => run("get", publicKey)
