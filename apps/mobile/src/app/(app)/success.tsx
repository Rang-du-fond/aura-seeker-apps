import { Image, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { CameraIcon, CheckIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { ThemeProvider, themed, useColors } from "@workspace/ui/native/theme"
import { palette, space } from "@workspace/ui/native/tokens"

import { BrandPattern } from "@/components/brand-pattern"
import { api } from "@/lib/client"
import { useT } from "@/lib/preferences"

// Pastilles bursting around the check mark: size, colour, offset from centre.
const burst = [
  [18, palette.yellow, -96, -64],
  [12, palette.magenta, 104, -76],
  [22, palette.orange, 120, 18],
  [10, palette.white, -124, 28],
  [14, palette.green, -80, 92],
  [16, palette.slate, 84, 96],
  [8, palette.white, 20, -118],
  [12, palette.yellow, 138, -20],
] as const

// This screen looks the same in both themes: its contents use the light one.
export default function SuccessScreen() {
  return (
    <ThemeProvider scheme="light">
      <Success />
    </ThemeProvider>
  )
}

function Success() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { id, title, image } = useLocalSearchParams<{
    id?: string
    title?: string
    image?: string
  }>()

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <StatusBar style="light" />
      <BrandPattern opacity={0.18} />

      <View style={styles.check} accessibilityElementsHidden>
        {burst.map(([size, backgroundColor, x, y], index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              left: 84 + x - size / 2,
              top: 84 + y - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
            }}
          />
        ))}
        <View style={styles.checkHalo}>
          <View style={styles.checkDisc}>
            <CheckIcon color={colors.blue} size={84} strokeWidth={3} />
          </View>
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        {t("success.wellDone")}
        {"\n"}
        <Text style={styles.subtitle}>{t("success.signPublishedMap")}</Text>
      </Text>

      <View accessibilityLabel={t("success.contribution")} style={styles.card}>
        {image ? (
          <Image source={{ uri: api.imageUrl(image) }} style={styles.photo} />
        ) : (
          <View style={styles.photo} />
        )}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title || t("common.newSign")}</Text>
          <Text variant="muted">{t("success.justNow")}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          size="lg"
          inverted
          icon={(props) => <CameraIcon {...props} />}
          onPress={() => router.replace("/capture")}
        >
          {t("success.recordAnotherSign")}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          inverted
          onPress={() =>
            router.dismissTo({
              pathname: "/map",
              params: id ? { sign: id } : {},
            })
          }
        >
          {t("success.seeOnMap")}
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
      alignItems: "center",
      paddingHorizontal: space.gutter,
      backgroundColor: colors.blue,
    },
    check: { width: 168, height: 168 },
    checkHalo: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      margin: -14,
      padding: 14,
      borderRadius: 98,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    checkDisc: {
      flex: 1,
      borderRadius: 84,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    title: {
      marginTop: 44,
      textAlign: "center",
      fontSize: 46,
      lineHeight: 48,
      fontWeight: "800",
      color: colors.white,
    },
    subtitle: {
      fontSize: 27,
      lineHeight: 34,
      fontWeight: "300",
      color: colors.white,
    },
    card: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 32,
      padding: 18,
      borderRadius: 24,
      backgroundColor: colors.white,
      shadowColor: colors.night,
      shadowOpacity: 0.25,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    photo: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.muted,
    },
    cardText: { flex: 1, gap: 2 },
    cardTitle: { fontWeight: "700", lineHeight: 20 },
    actions: { alignSelf: "stretch", marginTop: "auto", gap: 12 },
  })
)
