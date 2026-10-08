import * as React from "react"
import { Keyboard, Platform } from "react-native"

// Whether the on-screen keyboard is up. Screens use it to drop the space they
// keep for the system navigation bar, which the keyboard covers.
export function useKeyboardVisible() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    // iOS announces the keyboard before it moves, which follows it better.
    const [show, hide] =
      Platform.OS === "ios"
        ? (["keyboardWillShow", "keyboardWillHide"] as const)
        : (["keyboardDidShow", "keyboardDidHide"] as const)
    const shown = Keyboard.addListener(show, () => setVisible(true))
    const hidden = Keyboard.addListener(hide, () => setVisible(false))

    return () => {
      shown.remove()
      hidden.remove()
    }
  }, [])

  return visible
}
