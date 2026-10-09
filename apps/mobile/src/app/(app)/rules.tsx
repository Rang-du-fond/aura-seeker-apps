import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import {
  BanIcon,
  CarIcon,
  CheckIcon,
  EyeOffIcon,
  FileTextIcon,
} from "lucide-react-native"
import Svg, { Circle, Path, Rect } from "react-native-svg"

import { Button } from "@workspace/ui/native/button"
import { Checkbox } from "@workspace/ui/native/checkbox"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, space } from "@workspace/ui/native/tokens"

import { ScreenHeader } from "@/components/screen-header"
import { StatusBar } from "@/components/status-bar"
import type { MessageKey } from "@/lib/i18n"
import { useT } from "@/lib/preferences"
import { acceptRules } from "@/lib/rules"

type IconProps = { color: string; size: number }

// Drawn here: Lucide has no icon for these three.
function Glyph({
  color,
  size,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}

function FramedIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <Path d="m8 12 3 3 5-6" />
    </Glyph>
  )
}

function MovingIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <Circle cx={13} cy={4} r={1.5} />
      <Path d="m9 20 3-6 3 3 1 4" />
      <Path d="m6 9 4-1.5 3 1.5 2 3 3 1" />
      <Path d="M12 14l1-5.5" />
      <Path d="M2 12h3" />
      <Path d="M3 16h3" />
    </Glyph>
  )
}

function PlateIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <Rect x={2} y={7} width={20} height={10} rx={2} />
      <Path d="M6 7v10" />
      <Path d="M9 12h2" />
      <Path d="M13 12h2" />
      <Path d="M17 12h1" />
    </Glyph>
  )
}

// What a photo must not show, as translation keys.
const forbidden: {
  Icon: (props: IconProps) => React.ReactNode
  title: MessageKey
  detail: MessageKey
}[] = [
  {
    Icon: MovingIcon,
    title: "rules.nothingMoving",
    detail: "rules.passersCyclistsAnimalsWait",
  },
  {
    Icon: (props) => <CarIcon {...props} />,
    title: "rules.noVehicles",
    detail: "rules.carsBusesTrains",
  },
  {
    Icon: PlateIcon,
    title: "rules.noNumberPlates",
    detail: "rules.evenPartlyReadableBackground",
  },
  {
    Icon: (props) => <FileTextIcon {...props} />,
    title: "rules.noDocumentsRegion",
    detail: "rules.lettersFilesScreensInternal",
  },
  {
    Icon: (props) => <EyeOffIcon {...props} />,
    title: "rules.noPersonalSensitiveData",
    detail: "rules.facesNamesAddressesNumbers",
  },
]

// The photo rules. Last step of the onboarding, where they have to be
// accepted; opened again from the profile (`?review=1`) they are only shown.
export default function Rules() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { review } = useLocalSearchParams<{ review?: string }>()
  const [accepted, setAccepted] = React.useState(false)

  async function start() {
    await acceptRules()
    router.replace("/map")
  }

  return (
    <View style={styles.screen}>
      <StatusBar />
      {review && (
        <ScreenHeader
          title={t("common.photoRules")}
          backLabel={t("common.backMyProfile")}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          !review && { paddingTop: insets.top + 16 },
        ]}
      >
        {!review && (
          <Text variant="h1" accessibilityRole="header" style={styles.light}>
            <Text variant="h1">{t("rules.beforeStart")}</Text>
            {"\n"}
            {t("rules.fewRules")}
          </Text>
        )}

        <View style={styles.main}>
          <View style={styles.mainIcon}>
            <FramedIcon color={colors.white} size={24} />
          </View>
          <Text style={styles.mainText}>
            <Text style={styles.strong}>{t("rules.onlySign")}</Text>
            {t("rules.wellFramedSquare")}
          </Text>
        </View>

        <View>
          {forbidden.map(({ Icon, title, detail }, index) => (
            <View
              key={title}
              style={[styles.rule, index > 0 && styles.ruleDivider]}
            >
              <View style={styles.ruleIcon}>
                <Icon color={colors.foreground} size={24} />
                <View style={styles.ban}>
                  <BanIcon color={colors.white} size={12} strokeWidth={3} />
                </View>
              </View>
              <View style={styles.ruleText}>
                <Text style={styles.strong}>{t(title)}</Text>
                <Text variant="muted">{t(detail)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {!review && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            label={t("rules.iReadTheseRules")}
            checkIcon={(props) => <CheckIcon {...props} strokeWidth={3} />}
          >
            <Text style={styles.accept}>{t("rules.iReadTheseRules")}</Text>
          </Checkbox>
          <Button size="lg" disabled={!accepted} onPress={start}>
            {t("rules.getStarted")}
          </Button>
          <Text variant="muted" style={styles.note}>
            {t("rules.theseRulesRemainAvailable")}
          </Text>
        </View>
      )}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: space.gutter,
      gap: 18,
    },
    light: { fontWeight: "300" },
    main: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
    },
    mainIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blue,
    },
    mainText: { flex: 1, fontSize: 15, lineHeight: 21 },
    strong: { fontWeight: "700" },
    rule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
    },
    ruleDivider: { borderTopWidth: 1, borderTopColor: colors.muted },
    ruleIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    ban: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.magenta,
    },
    ruleText: { flex: 1, gap: 2 },
    footer: {
      paddingTop: 12,
      paddingHorizontal: space.gutter,
      gap: 12,
    },
    accept: { fontSize: 15 },
    note: { textAlign: "center" },
  })
)
