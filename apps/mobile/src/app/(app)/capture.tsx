import * as React from "react"
import { Image, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CameraView, useCameraPermissions } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
  ChevronRightIcon,
  ImageIcon,
  RotateCcwIcon,
  XIcon,
  ZapIcon,
  ZapOffIcon,
} from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { IconButton } from "@workspace/ui/native/icon-button"
import { Text } from "@workspace/ui/native/text"
import { ThemeProvider, themed, useColors } from "@workspace/ui/native/theme"
import { radius } from "@workspace/ui/native/tokens"

import { formatCoordinates, useDraft } from "@/lib/draft"
import { useT } from "@/lib/preferences"

const overlay = "rgba(30, 35, 44, 0.7)"

// This screen looks the same in both themes: its contents use the light one.
export default function CaptureScreen() {
  return (
    <ThemeProvider scheme="light">
      <Capture />
    </ThemeProvider>
  )
}

function Capture() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { draft, update, locate } = useDraft()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = React.useRef<CameraView>(null)
  const [cameraReady, setCameraReady] = React.useState(false)
  const [flash, setFlash] = React.useState(true)
  const [front, setFront] = React.useState(false)
  const [locationDenied, setLocationDenied] = React.useState(false)

  // Follow the position while the screen is open: the fix gets more accurate
  // over the first seconds.
  React.useEffect(() => {
    let subscription: Location.LocationSubscription | undefined
    let cancelled = false

    async function watch() {
      const { granted } = await Location.requestForegroundPermissionsAsync()
      if (!granted) {
        setLocationDenied(true)
        return
      }
      const use = ({ coords }: Location.LocationObject) => {
        if (!cancelled) {
          locate({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          })
        }
      }
      // A first fix right away, then updates as it improves. (On the web
      // preview only the first one arrives.)
      use(await Location.getCurrentPositionAsync())
      const started = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2 },
        use
      )
      if (cancelled) {
        started.remove()
      } else {
        subscription = started
      }
    }

    watch().catch(() => setLocationDenied(true))

    return () => {
      cancelled = true
      subscription?.remove()
    }
    // `locate` is stable enough: it only wraps a state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function takePhoto() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 })
    if (photo) {
      update({ photoUri: photo.uri })
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    })
    if (!result.canceled) {
      update({ photoUri: result.assets[0].uri })
    }
  }

  const { photoUri, position } = draft

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={front ? "front" : "back"}
            flash={flash ? "auto" : "off"}
            onCameraReady={() => setCameraReady(true)}
          />
        ) : (
          permission && (
            <View style={styles.permission}>
              <Text style={styles.hint}>{t("capture.cameraNotAllowed")}</Text>
              {permission.canAskAgain && (
                <Button size="sm" inverted onPress={() => requestPermission()}>
                  {t("common.allow")}
                </Button>
              )}
            </View>
          )
        )}
        <View pointerEvents="none" style={styles.guides}>
          {permission?.granted && (
            <>
              <Text style={styles.hint}>{t("capture.fitWholeSignFrame")}</Text>
              <View style={styles.frame} />
            </>
          )}
        </View>
      </View>

      <View style={[styles.top, { top: insets.top + 8 }]}>
        <IconButton
          label={t("common.close")}
          color={colors.white}
          backgroundColor={overlay}
          icon={(props) => <XIcon {...props} size={22} />}
          onPress={() => router.back()}
        />
        <IconButton
          label={flash ? t("capture.automaticFlash") : t("capture.flashOff")}
          color={colors.white}
          backgroundColor={overlay}
          icon={(props) =>
            flash ? <ZapIcon {...props} /> : <ZapOffIcon {...props} />
          }
          onPress={() => setFlash(!flash)}
        />
      </View>

      <View
        accessibilityRole="summary"
        style={[styles.gps, { top: insets.top + 68 }]}
      >
        <View style={[styles.gpsHalo, !position && styles.gpsHaloWaiting]}>
          <View style={[styles.gpsDot, !position && styles.gpsDotWaiting]} />
        </View>
        {position ? (
          <View>
            <Text style={styles.gpsTitle}>
              {t("capture.gpsPositionFound")}
              {position.accuracy !== null &&
                ` · ±${Math.round(position.accuracy)} m`}
            </Text>
            <Text variant="muted" style={styles.gpsCoords}>
              {formatCoordinates(position)}
            </Text>
          </View>
        ) : (
          <Text style={styles.gpsTitle}>
            {locationDenied
              ? t("capture.positionUnavailable")
              : t("capture.findingPosition")}
          </Text>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.takenRow, !photoUri && styles.hidden]}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.thumbnail} />
          )}
          <Text style={styles.takenLabel}>
            {position ? t("capture.photoTaken") : t("capture.waitingPosition")}
          </Text>
          <Button
            size="sm"
            inverted
            disabled={!photoUri || !position}
            iconEnd={(props) => <ChevronRightIcon {...props} />}
            style={styles.next}
            onPress={() => router.push("/new-sign")}
          >
            {t("capture.next")}
          </Button>
        </View>
        <View style={styles.shutterRow}>
          <IconButton
            label={t("capture.chooseGallery")}
            size={52}
            color={colors.white}
            backgroundColor={colors.slate}
            icon={(props) => <ImageIcon {...props} size={22} />}
            onPress={pickPhoto}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("capture.takePhoto")}
            disabled={!cameraReady}
            style={({ pressed }) => [
              styles.shutter,
              (pressed || !cameraReady) && styles.pressed,
            ]}
            onPress={takePhoto}
          >
            <View style={styles.shutterDisc} />
          </Pressable>
          <IconButton
            label={t("capture.switchCamera")}
            size={52}
            color={colors.white}
            backgroundColor={colors.slate}
            icon={(props) => <RotateCcwIcon {...props} size={22} />}
            onPress={() => setFront(!front)}
          />
        </View>
      </View>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.night },
    viewfinder: { flex: 1, overflow: "hidden", backgroundColor: "#2b313c" },
    guides: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    permission: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      padding: 24,
    },
    hint: { color: colors.white, fontWeight: "600", textAlign: "center" },
    frame: {
      width: 260,
      height: 260,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.8)",
    },
    top: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    gps: {
      position: "absolute",
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      backgroundColor: colors.white,
    },
    gpsHalo: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 195, 137, 0.25)",
    },
    gpsHaloWaiting: { backgroundColor: colors.muted },
    gpsDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.green,
    },
    gpsDotWaiting: { backgroundColor: colors.input },
    gpsTitle: { fontSize: 14, lineHeight: 17, fontWeight: "700" },
    gpsCoords: { fontSize: 12, lineHeight: 15 },
    controls: { paddingTop: 16, paddingHorizontal: 20, gap: 20 },
    takenRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 52,
    },
    hidden: { opacity: 0 },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.white,
      backgroundColor: "#4a5262",
    },
    takenLabel: { fontSize: 14, color: "#c9cdd4" },
    next: { marginLeft: "auto", height: 44 },
    shutterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    shutter: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    shutterDisc: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: colors.blue,
    },
    pressed: { opacity: 0.6 },
  })
)
