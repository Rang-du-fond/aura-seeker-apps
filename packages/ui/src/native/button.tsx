import * as React from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { useColors } from "./theme"
import { radius, type Colors } from "./tokens"

type Variant = "default" | "secondary" | "accent" | "ghost" | "destructive"
type Size = "default" | "sm" | "lg"

const sizes = {
  sm: { height: 40, paddingHorizontal: 16, fontSize: 14, gap: 6 },
  default: { height: 48, paddingHorizontal: 24, fontSize: 16, gap: 8 },
  lg: { height: 56, paddingHorizontal: 28, fontSize: 18, gap: 10 },
} as const

// `inverted` is the reversed style for blue, slate and dark backgrounds (what
// the web gets from the surface-blue / surface-slate classes).
function palette(variant: Variant, inverted: boolean, colors: Colors) {
  const solid = inverted ? colors.white : colors.primary
  const onSolid = inverted ? colors.slate : colors.primaryForeground

  switch (variant) {
    case "secondary":
      return { background: "transparent", border: solid, text: solid }
    case "accent":
      return {
        background: colors.blueText,
        border: colors.blueText,
        text: colors.white,
      }
    case "ghost":
      return { background: "transparent", border: "transparent", text: solid }
    case "destructive":
      return {
        background: "transparent",
        border: "transparent",
        text: colors.destructive,
      }
    default:
      return { background: solid, border: solid, text: onSolid }
  }
}

function Button({
  variant = "default",
  size = "default",
  inverted = false,
  icon,
  iconEnd,
  children,
  style,
  disabled,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  variant?: Variant
  size?: Size
  inverted?: boolean
  // Render props so the icon takes the label's colour and size.
  icon?: (props: { color: string; size: number }) => React.ReactNode
  iconEnd?: (props: { color: string; size: number }) => React.ReactNode
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()
  const { background, border, text } = palette(variant, inverted, colors)
  const { height, paddingHorizontal, fontSize, gap } = sizes[size]
  const iconProps = { color: text, size: fontSize + 4 }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { height, paddingHorizontal, gap },
        { backgroundColor: background, borderColor: border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {icon?.(iconProps)}
      <Text style={[styles.label, { color: text, fontSize }]}>{children}</Text>
      {iconEnd?.(iconProps)}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  label: { fontWeight: "700" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
})

export { Button }
