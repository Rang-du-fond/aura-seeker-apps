import { StatusBar as ExpoStatusBar } from "expo-status-bar"

import { useScheme } from "@workspace/ui/native/theme"

// Status bar icons that contrast with the current theme's background. Screens
// with a blue or dark header use expo-status-bar's `style="light"` directly.
export function StatusBar() {
  return <ExpoStatusBar style={useScheme() === "dark" ? "light" : "dark"} />
}
