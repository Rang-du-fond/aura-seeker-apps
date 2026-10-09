import { Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs"
import { CameraIcon, MapIcon, MapPin } from "lucide-react-native"

import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { useT } from "@/lib/preferences"

const tabs = {
  map: { label: "tabs.map", Icon: MapIcon },
  signs: { label: "tabs.mySigns", Icon: MapPin },
} as const

// Two tabs around a raised camera button that opens the capture flow.
function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()

  const items = state.routes.map((route, index) => {
    const { label, Icon } = tabs[route.name as keyof typeof tabs]
    const focused = state.index === index
    const color = focused ? colors.link : colors.mutedForeground

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        style={styles.tab}
        onPress={() => navigation.navigate(route.name)}
      >
        <Icon color={color} size={24} />
        <Text
          style={[styles.label, { color, fontWeight: focused ? "600" : "500" }]}
        >
          {t(label)}
        </Text>
      </Pressable>
    )
  })

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {items[0]}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.addSign")}
        style={styles.capture}
        onPress={() => router.push("/capture")}
      >
        <CameraIcon color={colors.white} size={28} />
      </Pressable>
      {items[1]}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="signs" />
    </Tabs>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-start",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    tab: { alignItems: "center", gap: 4, minWidth: 88, paddingTop: 6 },
    label: { fontSize: 12, lineHeight: 16 },
    capture: {
      width: 64,
      height: 64,
      marginTop: -30,
      borderRadius: 32,
      borderWidth: 4,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blue,
      shadowColor: colors.blue,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  })
)
