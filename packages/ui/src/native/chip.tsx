import * as React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { themed, useColors } from "./theme"
import { radius } from "./tokens"

// Pill used for filters (`selected` toggles) and removable tags (`onRemove`).
function Chip({
  selected = false,
  onPress,
  onRemove,
  removeLabel,
  removeIcon,
  children,
}: {
  selected?: boolean
  onPress?: () => void
  onRemove?: () => void
  removeLabel?: string
  removeIcon?: (props: { color: string; size: number }) => React.ReactNode
  children: string
}) {
  const colors = useColors()
  const styles = useStyles()
  const filled = selected || Boolean(onRemove)
  const color = filled ? colors.primaryForeground : colors.foreground
  const label = (
    <Text style={[styles.label, { color }, filled && styles.labelFilled]}>
      {children}
    </Text>
  )
  const style = [
    styles.base,
    filled ? styles.filled : styles.outlined,
    onRemove && styles.removable,
  ]

  if (onRemove) {
    return (
      <View style={style}>
        {label}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          hitSlop={6}
          style={styles.remove}
          onPress={onRemove}
        >
          {removeIcon?.({ color, size: 14 })}
        </Pressable>
      </View>
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={style}
      onPress={onPress}
    >
      {label}
    </Pressable>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
    },
    filled: { backgroundColor: colors.primary, borderColor: colors.primary },
    outlined: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    removable: { paddingLeft: 12, paddingRight: 2, gap: 2 },
    label: { fontSize: 14, fontWeight: "500" },
    labelFilled: { fontWeight: "600" },
    remove: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
  })
)

export { Chip }
