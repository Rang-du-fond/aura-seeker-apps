import * as React from "react"
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native"

import { Text } from "./text"
import { themed, useColors } from "./theme"
import { radius } from "./tokens"

function Input({
  style,
  multiline,
  leading,
  trailing,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  // Elements placed inside the field: on the left (e.g. a search icon) and on
  // the right (e.g. a show-password button).
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  const [focused, setFocused] = React.useState(false)
  const colors = useColors()
  const styles = useStyles()

  return (
    <View
      style={[
        styles.field,
        multiline && styles.multiline,
        focused && styles.focused,
      ]}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          Boolean(leading) && styles.inputAfterLeading,
          style,
        ]}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        {...props}
      />
      {trailing}
    </View>
  )
}

// A label, its control and an optional hint, like the web Field.
function Field({
  label,
  optional,
  hint,
  children,
  style,
}: {
  label: string
  optional?: string
  hint?: string
  children: React.ReactNode
  style?: React.ComponentProps<typeof View>["style"]
}) {
  const styles = useStyles()

  return (
    <View style={[styles.wrapper, style]}>
      <Text variant="label">
        {label}
        {optional && (
          <Text variant="label" style={styles.optional}>
            {" "}
            {optional}
          </Text>
        )}
      </Text>
      {children}
      {hint && <Text variant="muted">{hint}</Text>}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    wrapper: { gap: 6 },
    optional: { fontWeight: "400", color: colors.mutedForeground },
    field: {
      flexDirection: "row",
      alignItems: "center",
      height: 52,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.input,
      backgroundColor: colors.background,
    },
    multiline: { height: 88, alignItems: "stretch" },
    focused: { borderColor: colors.link, borderWidth: 2 },
    input: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      paddingHorizontal: 14,
      fontSize: 16,
      color: colors.foreground,
    },
    inputMultiline: { paddingVertical: 12 },
    leading: { paddingLeft: 14 },
    inputAfterLeading: { paddingLeft: 10 },
  })
)

export { Field, Input }
