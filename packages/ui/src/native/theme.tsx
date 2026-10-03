import * as React from "react"

import { darkColors, lightColors, type Colors } from "./tokens"

export type Scheme = "light" | "dark"

const Context = React.createContext<Scheme>("light")

// Sets the colour scheme for everything below. It can be nested: a screen
// that is always blue or always dark wraps itself in a fixed scheme.
export function ThemeProvider({
  scheme,
  children,
}: {
  scheme: Scheme
  children: React.ReactNode
}) {
  return <Context.Provider value={scheme}>{children}</Context.Provider>
}

export function useScheme() {
  return React.useContext(Context)
}

export function useColors(): Colors {
  return useScheme() === "dark" ? darkColors : lightColors
}

// Styles that depend on the theme: `const useStyles = themed((colors) =>
// StyleSheet.create({...}))`, then `const styles = useStyles()` in the
// component. Each scheme's styles are built once.
export function themed<Styles>(factory: (colors: Colors) => Styles) {
  const cache = new Map<Colors, Styles>()

  return function useStyles() {
    const colors = useColors()
    let styles = cache.get(colors)
    if (!styles) {
      styles = factory(colors)
      cache.set(colors, styles)
    }

    return styles
  }
}
