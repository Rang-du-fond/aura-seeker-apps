import * as React from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import { ChevronLeftIcon } from "lucide-react-native"

import { IconButton } from "@workspace/ui/native/icon-button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

// White header bar with a back button and a title.
export function ScreenHeader({
  title,
  backLabel,
  trailing,
}: {
  title: string
  backLabel: string
  trailing?: React.ReactNode
}) {
  const styles = useStyles()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <IconButton
        label={backLabel}
        icon={(props) => <ChevronLeftIcon {...props} size={24} />}
        onPress={() => router.back()}
      />
      <Text variant="h3" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {trailing}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingBottom: 10,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { flex: 1, fontSize: 19 },
  })
)
