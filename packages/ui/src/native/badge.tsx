import * as React from "react"
import { StyleSheet, Text, View, type ViewProps } from "react-native"

import { useColors } from "./theme"
import { radius, type Colors } from "./tokens"

type Variant =
  "default" | "secondary" | "magenta" | "success" | "accent" | "surface"

function palette(variant: Variant, colors: Colors) {
  switch (variant) {
    case "secondary":
      return { background: colors.muted, text: colors.foreground }
    case "magenta":
      return { background: colors.magenta, text: colors.white }
    case "success":
      return { background: colors.successMuted, text: colors.success }
    case "accent":
      return { background: colors.accent, text: colors.foreground }
    // White on any background: for blue and other brand surfaces.
    case "surface":
      return { background: colors.white, text: colors.slate }
    default:
      return { background: colors.primary, text: colors.primaryForeground }
  }
}

function Badge({
  variant = "default",
  icon,
  children,
  style,
  ...props
}: ViewProps & {
  variant?: Variant
  icon?: (props: { color: string; size: number }) => React.ReactNode
  children: React.ReactNode
}) {
  const { background, text } = palette(variant, useColors())

  return (
    <View
      style={[styles.base, { backgroundColor: background }, style]}
      {...props}
    >
      {icon?.({ color: text, size: 14 })}
      <Text style={[styles.label, { color: text }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  label: { fontSize: 12, fontWeight: "700" },
})

export { Badge }
