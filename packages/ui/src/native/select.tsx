import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Text } from "./text"
import { themed, useColors } from "./theme"
import { radius } from "./tokens"

type Option<Value extends string> = { value: Value; label: string }

// A dropdown: shows the current choice and opens the list of options below
// it. Icons are passed in by the app, like in the other components.
function Select<Value extends string>({
  value,
  options,
  onChange,
  label,
  chevronIcon,
  checkIcon,
}: {
  value: Value
  options: Option<Value>[]
  onChange: (value: Value) => void
  // Accessible name of the control.
  label: string
  chevronIcon?: (props: { color: string; size: number }) => React.ReactNode
  checkIcon?: (props: { color: string; size: number }) => React.ReactNode
}) {
  const colors = useColors()
  const styles = useStyles()
  const [open, setOpen] = React.useState(false)
  const current = options.find((option) => option.value === value)

  return (
    <View>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.value}>{current?.label}</Text>
        {chevronIcon?.({ color: colors.mutedForeground, size: 20 })}
      </Pressable>
      {open && (
        <View accessibilityRole="menu" style={styles.options}>
          {options.map((option) => {
            const selected = option.value === value

            return (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.option,
                  (pressed || selected) && styles.optionActive,
                ]}
                onPress={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Text style={[styles.value, selected && styles.selected]}>
                  {option.label}
                </Text>
                {selected &&
                  checkIcon?.({ color: colors.foreground, size: 18 })}
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      height: 52,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.input,
      backgroundColor: colors.background,
    },
    triggerOpen: { borderColor: colors.link, borderWidth: 2 },
    value: { flex: 1 },
    selected: { fontWeight: "600" },
    options: {
      overflow: "hidden",
      marginTop: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
      paddingHorizontal: 14,
    },
    optionActive: { backgroundColor: colors.muted },
  })
)

export { Select }
