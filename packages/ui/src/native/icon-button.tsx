import * as React from "react"
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { useColors } from "./theme"

// Round button holding a single icon. `label` is required: it is the only name
// assistive tech gets.
function IconButton({
  label,
  size = 44,
  color,
  backgroundColor = "transparent",
  icon,
  style,
  ...props
}: Omit<PressableProps, "children" | "style"> & {
  label: string
  size?: number
  color?: string
  backgroundColor?: string
  icon: (props: { color: string; size: number }) => React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const colors = useColors()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 44 ? (44 - size) / 2 : undefined}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...props}
    >
      {icon({
        color: color ?? colors.foreground,
        size: Math.round(size * 0.46),
      })}
    </Pressable>
  )
}

export { IconButton }
