import { Stack } from "expo-router"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { useColors } from "@workspace/ui/native/theme"

import { PreferencesProvider } from "@/lib/preferences"
import { SessionProvider, useSession } from "@/lib/session"

function Screens() {
  const { ready } = useSession()
  const colors = useColors()

  // Nothing is shown until the stored session has been read, so a signed-in
  // user never sees the welcome screen flash by.
  if (!ready) {
    return null
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <SessionProvider>
          <Screens />
        </SessionProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  )
}
