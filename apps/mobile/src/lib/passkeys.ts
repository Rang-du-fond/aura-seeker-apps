// Passkeys through the browser's WebAuthn API: this file is the web build.
// Phones use passkeys.native.ts, which Metro picks instead; both export the
// same functions.
//
// The API sends WebAuthn options as JSON (binary fields in base64url) and
// expects the device's answer as JSON too.

// "unsupported": no passkeys on this device or build. "cancelled": the user
// closed the system dialog, or had no passkey to offer.
export class PasskeyError extends Error {
  constructor(readonly code: "unsupported" | "cancelled" | "failed") {
    super(code)
  }
}

type Json = Record<string, unknown>

function toBuffer(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))

  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function fromBuffer(buffer: ArrayBuffer | null) {
  if (!buffer) {
    return null
  }
  let binary = ""
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// For browsers without PublicKeyCredential.parse…OptionsFromJSON / toJSON.
function decodeOptions(options: Json) {
  const decodeIds = (list: unknown) =>
    (list as Json[] | undefined)?.map((entry) => ({
      ...entry,
      id: toBuffer(entry.id as string),
    }))
  const user = options.user as Json | undefined

  return {
    ...options,
    challenge: toBuffer(options.challenge as string),
    ...(user && { user: { ...user, id: toBuffer(user.id as string) } }),
    ...(options.allowCredentials !== undefined && {
      allowCredentials: decodeIds(options.allowCredentials),
    }),
    ...(options.excludeCredentials !== undefined && {
      excludeCredentials: decodeIds(options.excludeCredentials),
    }),
  }
}

function encodeCredential(credential: PublicKeyCredential): Json {
  const response = credential.response as AuthenticatorAttestationResponse &
    AuthenticatorAssertionResponse

  return {
    id: credential.id,
    rawId: fromBuffer(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {
      clientDataJSON: fromBuffer(response.clientDataJSON),
      ...(response.attestationObject && {
        attestationObject: fromBuffer(response.attestationObject),
        transports: response.getTransports?.(),
      }),
      ...(response.authenticatorData && {
        authenticatorData: fromBuffer(response.authenticatorData),
        signature: fromBuffer(response.signature),
        userHandle: fromBuffer(response.userHandle),
      }),
    },
  }
}

export function passkeysSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  )
}

async function run(kind: "create" | "get", publicKey: Json): Promise<Json> {
  if (!passkeysSupported()) {
    throw new PasskeyError("unsupported")
  }
  // The browser's own JSON helpers when it has them, by hand otherwise.
  const parse = (kind === "create"
    ? PublicKeyCredential.parseCreationOptionsFromJSON
    : PublicKeyCredential.parseRequestOptionsFromJSON) as unknown as
    ((this: unknown, options: Json) => unknown) | undefined
  const options = parse
    ? parse.call(PublicKeyCredential, publicKey)
    : decodeOptions(publicKey)

  let credential: Credential | null
  try {
    credential = await navigator.credentials[kind]({
      publicKey: options as never,
    })
  } catch (error) {
    // The browser's own reason, for the console.
    console.warn(`Passkey ${kind} failed:`, error)
    // NotAllowedError covers a dismissed dialog and "no passkey here".
    throw new PasskeyError(
      error instanceof DOMException && error.name === "NotAllowedError"
        ? "cancelled"
        : "failed"
    )
  }
  if (!credential) {
    throw new PasskeyError("cancelled")
  }
  const publicKeyCredential = credential as PublicKeyCredential

  return typeof publicKeyCredential.toJSON === "function"
    ? (publicKeyCredential.toJSON() as unknown as Json)
    : encodeCredential(publicKeyCredential)
}

// Creates a passkey on this device from the API's creation options.
export const createPasskey = (publicKey: Json) => run("create", publicKey)

// Asks the device for one of the user's passkeys, from the API's request
// options.
export const getPasskey = (publicKey: Json) => run("get", publicKey)
