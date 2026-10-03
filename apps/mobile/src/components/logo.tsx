import { Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"

import { ideogram } from "@workspace/ui/lib/logo-glyphs"
import { useColors } from "@workspace/ui/native/theme"

// The ideogram of the official logo. `inverted` is the reversed variant for
// blue backgrounds: white pastille, blue mark.
export function LogoMark({
  size,
  inverted = false,
}: {
  size: number
  inverted?: boolean
}) {
  const colors = useColors()
  return (
    <Svg width={size} height={size} viewBox={ideogram.viewBox}>
      <Path d={ideogram.disc} fill={inverted ? colors.blue : colors.white} />
      <Path
        d={ideogram.mark}
        fill={inverted ? colors.white : colors.blue}
        fillRule="evenodd"
      />
    </Svg>
  )
}

export function Logo({
  size = 36,
  inverted = false,
  fontSize = 20,
}: {
  size?: number
  inverted?: boolean
  fontSize?: number
}) {
  const colors = useColors()
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} inverted={inverted} />
      <Text
        style={{
          fontSize,
          fontWeight: "700",
          color: inverted ? colors.white : colors.foreground,
        }}
      >
        La Région
      </Text>
    </View>
  )
}
