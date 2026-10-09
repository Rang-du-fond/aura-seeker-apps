import * as React from "react"
import { Linking, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useCameraPermissions } from "expo-camera"
import { useForegroundPermissions } from "expo-location"
import { router } from "expo-router"
import { CameraIcon, CheckIcon, MapPinIcon } from "lucide-react-native"

import { Badge } from "@workspace/ui/native/badge"
import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, space } from "@workspace/ui/native/tokens"
import { afterPermissions } from "@/lib/permissions"
import { useT } from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

export default function Permissions() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const [camera, requestCamera] = useCameraPermissions()
  const [location, requestLocation] = useForegroundPermissions()
  // Permissions the system refused to even ask for. This is only known after
  // trying: before the first request, Android reports "cannot ask again" for
  // a permission that has simply never been asked, so the status alone must
  // not hide the "Autoriser" button.
  const [blocked, setBlocked] = React.useState<string[]>([])

  async function ask(
    key: string,
    request: () => Promise<{ granted: boolean; canAskAgain: boolean }>
  ) {
    const result = await request()
    if (!result.granted && !result.canAskAgain) {
      setBlocked((current) => [...current, key])
    }
  }

  const permissions = [
    {
      key: "camera",
      Icon: CameraIcon,
      title: t("permissions.camera"),
      reason: t("permissions.photographSign"),
      status: camera,
      request: requestCamera,
    },
    {
      key: "location",
      Icon: MapPinIcon,
      title: t("permissions.location"),
      reason: t("permissions.placeSignMap"),
      status: location,
      request: requestLocation,
    },
  ]

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <StatusBar />

      <View style={styles.art} accessibilityElementsHidden>
        <View style={[styles.disc, styles.discCamera]}>
          <CameraIcon color={colors.white} size={60} />
        </View>
        <View style={[styles.disc, styles.discPin]}>
          <MapPinIcon color={colors.white} size={38} />
        </View>
        <View
          style={[
            styles.dot,
            {
              left: 270,
              top: 20,
              width: 22,
              height: 22,
              backgroundColor: colors.yellow,
            },
          ]}
        />
        <View
          style={[
            styles.dot,
            {
              left: 40,
              top: 130,
              width: 14,
              height: 14,
              backgroundColor: colors.magenta,
            },
          ]}
        />
        <View
          style={[
            styles.dot,
            {
              left: 290,
              top: 140,
              width: 12,
              height: 12,
              backgroundColor: colors.green,
            },
          ]}
        />
      </View>

      <Text variant="h1" accessibilityRole="header" style={styles.light}>
        <Text variant="h1">{t("permissions.twoPermissions")}</Text>
        {"\n"}
        {t("permissions.getStarted")}
      </Text>

      <View style={styles.list}>
        {permissions.map(({ key, Icon, title, reason, status, request }) => (
          <View key={key} style={styles.item}>
            <View style={styles.itemIcon}>
              <Icon color={colors.link} size={22} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{title}</Text>
              <Text variant="muted">{reason}</Text>
            </View>
            {status?.granted ? (
              <Badge
                variant="success"
                icon={(props) => <CheckIcon {...props} strokeWidth={3} />}
                style={styles.granted}
              >
                {t("permissions.allowed")}
              </Badge>
            ) : blocked.includes(key) ? (
              // Refused for good: the system no longer shows its prompt, only
              // the phone's settings can change the choice.
              <Button
                size="sm"
                variant="secondary"
                onPress={() => Linking.openSettings()}
              >
                {t("permissions.settings")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="accent"
                onPress={() => ask(key, request)}
              >
                {t("common.allow")}
              </Button>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          size="lg"
          onPress={async () => router.replace(await afterPermissions())}
        >
          {t("permissions.continue")}
        </Button>
        <Text variant="muted" style={styles.note}>
          {t("permissions.changeTheseChoicesPhones")}
        </Text>
      </View>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: space.gutter,
      gap: 24,
      backgroundColor: colors.background,
    },
    art: { height: 170 },
    disc: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    discCamera: {
      left: 70,
      top: 10,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.blue,
    },
    discPin: {
      left: 182,
      top: 78,
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 5,
      borderColor: colors.background,
      backgroundColor: colors.slate,
    },
    dot: { position: "absolute", borderRadius: radius.pill },
    light: { fontWeight: "300" },
    list: { gap: 12 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 14,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
    },
    itemText: { flex: 1, gap: 2 },
    itemTitle: { fontWeight: "700" },
    granted: { alignSelf: "center", paddingVertical: 6 },
    footer: { marginTop: "auto", gap: 12 },
    note: { textAlign: "center" },
  })
)
