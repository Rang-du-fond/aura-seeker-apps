import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Redirect, router } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { space } from "@workspace/ui/native/tokens"

import { BrandPattern } from "@/components/brand-pattern"
import { LogoMark } from "@/components/logo"
import { useSession } from "@/lib/session"
import { useT } from "@/lib/preferences"

export default function Welcome() {
  const t = useT()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { session, expired } = useSession()

  // Already signed in at launch: go straight to the map.
  if (session) {
    return <Redirect href="/map" />
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <StatusBar style="light" />
      <BrandPattern opacity={0.18} />

      <View style={styles.brand}>
        <LogoMark size={64} inverted />
        <View>
          <Text style={styles.brandName}>La Région</Text>
          <Text style={styles.brandRegion}>Auvergne-Rhône-Alpes</Text>
        </View>
      </View>

      <View style={styles.pitch}>
        <Text variant="display" accessibilityRole="header" style={styles.white}>
          <Text variant="display" style={[styles.white, styles.black]}>
            {t("welcome.record")}
          </Text>
          {"\n"}
          {t("welcome.regionsSigns")}
        </Text>
        <Text variant="lead" style={styles.white}>
          {t("welcome.onePhotoPositionMap")}
        </Text>
      </View>

      <View style={styles.actions}>
        {expired && (
          <Text accessibilityRole="alert" style={[styles.white, styles.notice]}>
            {t("welcome.sessionExpiredSignAgain")}
          </Text>
        )}
        <Button size="lg" inverted onPress={() => router.push("/login")}>
          {t("common.signIn")}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          inverted
          onPress={() => router.push("/signup")}
        >
          {t("common.createAccount")}
        </Button>
      </View>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      overflow: "hidden",
      paddingHorizontal: space.gutter,
      backgroundColor: colors.blue,
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 14 },
    brandName: {
      fontSize: 30,
      lineHeight: 32,
      fontWeight: "700",
      color: colors.white,
    },
    brandRegion: {
      fontSize: 19,
      lineHeight: 21,
      fontWeight: "700",
      color: colors.white,
    },
    pitch: { marginTop: "auto", marginBottom: 32, gap: 16 },
    white: { color: colors.white },
    black: { fontWeight: "800" },
    actions: { gap: 12 },
    notice: { textAlign: "center", fontWeight: "600" },
  })
)
