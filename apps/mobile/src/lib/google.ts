// Google sign-in. This file is the web build and the fallback: the native
// Google dialog only exists on Android (see google.native.ts), which Metro
// picks instead on phones. Both export the same functions.

// "unsupported": no native Google dialog on this platform or build.
// "cancelled": the user closed the dialog.
export class GoogleError extends Error {
  constructor(readonly code: "unsupported" | "cancelled" | "failed") {
    super(code)
  }
}

// Shows Google's account dialog and returns the ID token it issues. `nonce`
// comes from the API (GET /auth/nonce) and ends up inside the token, which is
// how the API knows the token was made for this sign-in.
export async function getGoogleIdToken(_nonce: string): Promise<string> {
  throw new GoogleError("unsupported")
}
