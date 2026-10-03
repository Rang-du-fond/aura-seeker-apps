import { Redirect, Stack } from "expo-router"

import { useColors } from "@workspace/ui/native/theme"

import { DraftProvider } from "@/lib/draft"
import { LikesProvider } from "@/lib/likes"
import { useSession } from "@/lib/session"

// Everything in this group needs a session. Signing out, or the session
// expiring, sends the user back to the welcome screen from wherever they are.
export default function AppLayout() {
  const { session } = useSession()
  const colors = useColors()

  if (!session) {
    return <Redirect href="/" />
  }

  return (
    <LikesProvider>
      <DraftProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="capture"
            options={{ presentation: "fullScreenModal", animation: "fade" }}
          />
        </Stack>
      </DraftProvider>
    </LikesProvider>
  )
}
