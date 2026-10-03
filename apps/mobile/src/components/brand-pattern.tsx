import * as React from "react"
import { StyleSheet, View } from "react-native"
import Svg, { Path } from "react-native-svg"

import { logoGlyphs } from "@workspace/ui/lib/logo-glyphs"
import { scatter, seededRandom } from "@workspace/ui/lib/scatter"
import { palette } from "@workspace/ui/native/tokens"

const names = Object.keys(logoGlyphs) as (keyof typeof logoGlyphs)[]
// Size of the shapes relative to the logo's own, and the space left between
// two of them: the same settings as the web hero.
const scale = 0.48
const gap = 5

// The radius of the circle, around its centre, that a shape fits in.
function radius(d: string) {
  const numbers = d.match(/-?\d+\.?\d*/g)!.map(Number)
  let max = 0
  for (let index = 0; index < numbers.length; index += 2) {
    max = Math.max(max, Math.hypot(numbers[index], numbers[index + 1]))
  }

  return max
}

// Centres two radii (plus the gap) apart: two shapes can never touch,
// whatever their rotation.
const minDistance =
  2 * Math.max(...names.map((name) => radius(logoGlyphs[name]))) * scale + gap

// The three shapes of the logo scattered over the background, as in the web
// hero: placed at random with an even density and no overlap (see scatter).
// Fills its parent; place it first in a view with `overflow: "hidden"`.
export function BrandPattern({ opacity = 0.2 }: { opacity?: number }) {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  const shapes = React.useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return []
    }
    // Seeded, so the pattern is the same each time for a given size.
    const random = seededRandom(20261005)

    return scatter({ ...size, minDistance, random }).map(({ x, y }) => ({
      d: logoGlyphs[names[Math.floor(random() * names.length)]],
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.floor(
        random() * 360
      )}) scale(${scale})`,
    }))
  }, [size])

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity }]}
      onLayout={({ nativeEvent }) =>
        setSize({
          width: nativeEvent.layout.width,
          height: nativeEvent.layout.height,
        })
      }
    >
      <Svg width={size.width} height={size.height}>
        {shapes.map(({ d, transform }) => (
          <Path
            key={transform}
            d={d}
            transform={transform}
            fill={palette.white}
          />
        ))}
      </Svg>
    </View>
  )
}
