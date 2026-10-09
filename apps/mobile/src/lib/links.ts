import { Linking } from "react-native"

// The web app, where the legal pages live. Override with EXPO_PUBLIC_WEB_URL.
const webUrl = (
  process.env.EXPO_PUBLIC_WEB_URL || "https://aura-seeker.matheo-galuba.com"
).replace(/\/$/, "")

export type WebPage = "/legal" | "/accessibility" | "/privacy"

// Opens a page of the web app in the phone's browser.
export function openWebPage(page: WebPage) {
  // Nothing to do if no browser can open it.
  Linking.openURL(webUrl + page).catch(() => {})
}
