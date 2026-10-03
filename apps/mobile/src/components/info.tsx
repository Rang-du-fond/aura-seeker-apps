import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@workspace/ui/native/text"
import { themed } from "@workspace/ui/native/theme"
import { radius } from "@workspace/ui/native/tokens"

import { ScreenHeader } from "@/components/screen-header"
import { StatusBar } from "@/components/status-bar"

// Layout of the text pages reached from the profile (help, personal data): a
// header with a back button, then titled cards.
export function InfoScreen({
  title,
  backLabel,
  children,
}: {
  title: string
  backLabel: string
  children: React.ReactNode
}) {
  const styles = useStyles()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScreenHeader title={title} backLabel={backLabel} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  )
}

export function InfoSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const styles = useStyles()

  return (
    <View style={styles.section}>
      <Text
        variant="overline"
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  )
}

// One point of a list, or one question with its answer when `title` is set.
export function InfoItem({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  const styles = useStyles()

  return (
    <View style={styles.item}>
      {title && <Text style={styles.itemTitle}>{title}</Text>}
      <Text style={styles.itemText}>{children}</Text>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.canvas },
    content: { padding: 16, gap: 16 },
    section: { gap: 8 },
    sectionTitle: { marginHorizontal: 4 },
    card: {
      gap: 14,
      padding: 16,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
    },
    item: { gap: 2 },
    itemTitle: { fontWeight: "700" },
    itemText: { fontSize: 15, lineHeight: 22 },
  })
)
