import * as React from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Redirect, router } from "expo-router"
import { CheckIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, shadow, space } from "@workspace/ui/native/tokens"

import { ScreenHeader } from "@/components/screen-header"
import { PositionMap, type MapPoint } from "@/components/sign-map"
import { formatCoordinates, useDraft } from "@/lib/draft"
import { useT } from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

export default function AdjustPosition() {
  const t = useT()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { draft, update } = useDraft()
  // Where the map opened, and where the user has moved it to since.
  const [start] = React.useState(draft.position)
  const [moved, setMoved] = React.useState<MapPoint | null>(null)

  // The map also reports its position when it opens: only a real move counts.
  const onMove = React.useCallback(
    (point: MapPoint) =>
      setMoved(
        start &&
          Math.abs(point.latitude - start.latitude) < 1e-6 &&
          Math.abs(point.longitude - start.longitude) < 1e-6
          ? null
          : point
      ),
    [start]
  )

  if (!start) {
    return <Redirect href="/capture" />
  }

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScreenHeader title={t("Ajuster la position")} backLabel={t("Annuler")} />

      <View style={styles.map}>
        <PositionMap position={start} onMove={onMove} />
        <View pointerEvents="none" style={[styles.hint, shadow.card]}>
          <Text variant="label">
            {t("Déplacez la carte pour placer le repère sur le panneau.")}
          </Text>
          <Text variant="muted">{formatCoordinates(moved ?? start)}</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          size="lg"
          icon={(props) => <CheckIcon {...props} />}
          onPress={() => {
            if (moved) {
              update({
                position: { ...moved, accuracy: null },
                adjusted: true,
              })
            }
            router.back()
          }}
        >
          {t("Valider la position")}
        </Button>
      </View>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    map: { flex: 1 },
    hint: {
      position: "absolute",
      top: 12,
      left: 16,
      right: 16,
      gap: 2,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
    },
    footer: {
      paddingTop: 12,
      paddingHorizontal: space.gutter,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  })
)
