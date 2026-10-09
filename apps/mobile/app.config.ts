import type { ConfigContext, ExpoConfig } from "expo/config"

// Adds to app.json what depends on the build variant. Debug builds (the
// default) get their own identifier and name, so they install next to a
// release build instead of replacing it. Set APP_VARIANT=production for a
// release build.
const production = process.env.APP_VARIANT === "production"
const identifier = production ? "fr.auraseeker.app" : "fr.auraseeker.app.debug"

// Set by the release workflow: the version shown to users (from the git tag)
// and Android's version code, which must grow with each release for a phone
// to accept it as an update.
const version = process.env.APP_VERSION
const versionCode = Number(process.env.ANDROID_VERSION_CODE) || undefined

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    // Where the "Aide et contact" page writes to. Unset: the page says the
    // address is not configured yet.
    contactEmail: process.env.EXPO_PUBLIC_CONTACT_EMAIL,
    // The API's Google *web* client ID (`client_id_web` in its config.toml):
    // the audience of the ID tokens the native Google dialog issues. It is a
    // public identifier, not a secret.
    googleWebClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
      "822111550536-4ie3pp8udln3k13pifej8ofaoins2qda.apps.googleusercontent.com",
  },
  name: production ? "Aura Seeker" : "Aura Seeker (debug)",
  slug: "aura-seeker",
  version: version ?? config.version,
  ios: { ...config.ios, bundleIdentifier: identifier },
  android: {
    ...config.android,
    package: identifier,
    versionCode: versionCode ?? config.android?.versionCode,
  },
})
