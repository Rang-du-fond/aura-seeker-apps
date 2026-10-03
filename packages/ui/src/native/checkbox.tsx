import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { themed, useColors } from "./theme"

function Checkbox({
  checked,
  onCheckedChange,
  label,
  checkIcon,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  // Accessible name, since `children` may be rich text with links.
  label: string
  checkIcon?: (props: { color: string; size: number }) => React.ReactNode
  children?: React.ReactNode
}) {
  const colors = useColors()
  const styles = useStyles()

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.row}
      onPress={() => onCheckedChange(!checked)}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked && checkIcon?.({ color: colors.primaryForeground, size: 16 })}
      </View>
      <View style={styles.content}>{children}</View>
    </Pressable>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 4,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.input,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    checked: { backgroundColor: colors.primary, borderColor: colors.primary },
    content: { flex: 1 },
  })
)

export { Checkbox }
