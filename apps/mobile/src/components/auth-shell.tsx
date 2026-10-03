import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ChevronLeftIcon } from "lucide-react-native"

import { Badge } from "@workspace/ui/native/badge"
import { IconButton } from "@workspace/ui/native/icon-button"
import { themed, useColors } from "@workspace/ui/native/theme"
import { space } from "@workspace/ui/native/tokens"

import { BrandPattern } from "@/components/brand-pattern"
import { Logo } from "@/components/logo"
import { useT } from "@/lib/preferences"

// Onboarding layout: blue patterned header with a back button, then a white
// sheet with rounded top corners holding the form.
export function AuthShell({
  step,
  children,
}: {
  // "Étape 1 / 3" badge; without it the header shows the logo instead.
  step?: string
  children: React.ReactNode
}) {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BrandPattern opacity={0.18} />
        <View style={styles.headerRow}>
          <IconButton
            label={t("Retour")}
            color={colors.white}
            backgroundColor="rgba(255, 255, 255, 0.2)"
            icon={(props) => <ChevronLeftIcon {...props} size={22} />}
            onPress={() => router.back()}
          />
          {step && <Badge variant="surface">{step}</Badge>}
        </View>
        {!step && <Logo size={40} fontSize={22} inverted />}
      </View>
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.blue },
    header: {
      overflow: "hidden",
      paddingHorizontal: 16,
      paddingBottom: 48,
      gap: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sheet: {
      flex: 1,
      marginTop: -24,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingTop: 30,
      paddingHorizontal: space.gutter,
      gap: 18,
    },
  })
)
