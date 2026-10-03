import * as React from "react"
import { Pressable, StyleSheet, TextInput, View } from "react-native"

import { Text } from "@workspace/ui/native/text"
import { themed } from "@workspace/ui/native/theme"
import { radius } from "@workspace/ui/native/tokens"

export const codeLength = 6

// The 6-digit code from an email. One real field holds the code (so paste
// and the keyboard's one-time-code suggestion work); the boxes only display
// its digits.
export function CodeInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (code: string) => void
  label: string
}) {
  const styles = useStyles()
  const inputRef = React.useRef<TextInput>(null)

  return (
    <Pressable
      accessibilityLabel={label}
      style={styles.boxes}
      onPress={() => inputRef.current?.focus()}
    >
      {Array.from({ length: codeLength }, (_, index) => (
        <View
          key={index}
          style={[styles.box, index === value.length && styles.boxActive]}
        >
          <Text style={styles.digit}>{value[index] ?? ""}</Text>
        </View>
      ))}
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/\D/g, "").slice(0, codeLength))
        }
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={codeLength}
        caretHidden
        autoFocus
        style={styles.hiddenInput}
      />
    </Pressable>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    boxes: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    box: {
      width: 48,
      height: 60,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.input,
      alignItems: "center",
      justifyContent: "center",
    },
    boxActive: { borderWidth: 2, borderColor: colors.link },
    digit: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
    hiddenInput: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 0,
    },
  })
)
