import { Platform } from "react-native"
import Constants from "expo-constants"

// Google sign-in on phones, through Android's Credential Manager (the web
// build uses google.ts). iOS has no implementation yet.
//
// This needs a development build: the native module is not in Expo Go. In
// Google Cloud, the Android OAuth client must be registered for the app's
// package name and the SHA-1 of the key that signs the build, otherwise the
// dialog fails without showing accounts.

export class GoogleError extends Error {
  constructor(readonly code: "unsupported" | "cancelled" | "failed") {
    super(code)
  }
}

// The API's *web* client ID (`client_id_web` in its config): the audience
// Google puts in the ID token. It comes from app.config.ts.
const serverClientId: string | undefined =
  Constants.expoConfig?.extra?.googleWebClientId

export async function getGoogleIdToken(nonce: string): Promise<string> {
  if (Platform.OS !== "android" || !serverClientId) {
    throw new GoogleError("unsupported")
  }
  // Loaded on first use: importing the library where its native module is
  // missing (Expo Go) must not break the app.
  let library: typeof import("react-native-credentials-manager")
  try {
    library = require("react-native-credentials-manager")
  } catch {
    throw new GoogleError("unsupported")
  }

  try {
    const credential = await library.signUpWithGoogle({
      nonce,
      serverClientId,
      // Always show the account chooser: this is an explicit button press.
      autoSelectEnabled: false,
    })

    return credential.idToken
  } catch (error) {
    const message = String((error as { message?: string } | null)?.message)
    // The system's own reason, for the development log.
    console.warn("Google sign-in failed:", message)
    throw new GoogleError(/cancel/i.test(message) ? "cancelled" : "failed")
  }
}
