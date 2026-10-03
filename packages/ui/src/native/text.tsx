import {
  Text as NativeText,
  type TextProps,
  type TextStyle,
} from "react-native"

import { useColors } from "./theme"

// Same variant names as the web Text component, with the mobile sizes of the
// type scale. The platform font stands in for Graphik until it is licensed.
const variants = {
  display: { fontSize: 44, lineHeight: 46, fontWeight: "300" },
  h1: { fontSize: 30, lineHeight: 33, fontWeight: "800" },
  h2: { fontSize: 22, lineHeight: 26, fontWeight: "700" },
  h3: { fontSize: 18, lineHeight: 23, fontWeight: "700" },
  p: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  lead: { fontSize: 24, lineHeight: 31, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 18, fontWeight: "600" },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  muted: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  overline: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
} as const satisfies Record<string, TextStyle>

export type TextVariant = keyof typeof variants

function Text({
  variant = "p",
  style,
  ...props
}: TextProps & { variant?: TextVariant }) {
  const colors = useColors()

  return (
    <NativeText
      style={[
        {
          color:
            variant === "muted" || variant === "overline"
              ? colors.mutedForeground
              : colors.foreground,
        },
        variants[variant],
        style,
      ]}
      {...props}
    />
  )
}

export { Text }
