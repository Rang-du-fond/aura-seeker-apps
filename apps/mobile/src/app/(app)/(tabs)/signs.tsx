import * as React from "react"
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router, useFocusEffect } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { CameraIcon, PencilIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { IconButton } from "@workspace/ui/native/icon-button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, space } from "@workspace/ui/native/tokens"

import { BrandPattern } from "@/components/brand-pattern"
import { Logo } from "@/components/logo"
import type { Place } from "@/lib/api"
import { api } from "@/lib/client"
import { useUser } from "@/lib/session"
import { useLocale, useT } from "@/lib/preferences"

export default function Signs() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const user = useUser()
  const [signs, setSigns] = React.useState<Place[] | null>(null)
  const [loadFailed, setLoadFailed] = React.useState(false)
  const locale = useLocale()
  const dateFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  )

  // Reload each time the tab is shown, so a sign just added is there.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false
      api
        .places({ authorId: user.id })
        .then((loaded) => {
          if (!cancelled) {
            setSigns(
              loaded.sort((a, b) => b.created_at.localeCompare(a.created_at))
            )
            setLoadFailed(false)
          }
        })
        .catch(() => !cancelled && setLoadFailed(true))

      return () => {
        cancelled = true
      }
    }, [user.id])
  )

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BrandPattern opacity={0.22} />
        <View style={styles.headerRow}>
          <Logo inverted />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("signs.myProfileSettings")}
            style={styles.avatar}
            onPress={() => router.push("/profile")}
          >
            <NativeText style={styles.avatarLabel}>{user.initials}</NativeText>
          </Pressable>
        </View>
        <Text variant="h1" accessibilityRole="header" style={styles.greeting}>
          {t("signs.hello", { name: user.firstName })}
        </Text>
        <Button
          size="lg"
          inverted
          icon={(props) => <CameraIcon {...props} />}
          onPress={() => router.push("/capture")}
        >
          {t("common.addSign")}
        </Button>
      </View>

      <FlatList
        data={signs ?? []}
        keyExtractor={(sign) => sign.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text variant="h2" accessibilityRole="header">
              {t("signs.myContributions")}
            </Text>
            {signs && (
              <Text variant="muted" style={styles.count}>
                {t("common.signCount", { count: signs.length })}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text variant="muted" style={styles.empty}>
            {loadFailed
              ? t("signs.signsCouldNotLoaded")
              : signs
                ? t("signs.haventRecordedSignYet")
                : t("common.loading")}
          </Text>
        }
        renderItem={({ item: sign }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("signs.seeOnMap", {
              title: sign.title,
            })}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            onPress={() =>
              router.navigate({ pathname: "/map", params: { sign: sign.id } })
            }
          >
            <Image
              source={{ uri: api.imageUrl(sign.image) }}
              style={styles.photo}
            />
            <View style={styles.itemText}>
              {sign.tags.length > 0 && (
                <Text numberOfLines={1} style={styles.tagLabel}>
                  {sign.tags.join(" · ")}
                </Text>
              )}
              <Text numberOfLines={2} style={styles.itemTitle}>
                {sign.title}
              </Text>
              <Text variant="muted">
                {dateFormat.format(new Date(sign.created_at))}
              </Text>
            </View>
            <IconButton
              label={t("signs.edit", { title: sign.title })}
              color={colors.mutedForeground}
              icon={(props) => <PencilIcon {...props} />}
              onPress={() =>
                router.push({ pathname: "/edit-sign", params: { id: sign.id } })
              }
            />
          </Pressable>
        )}
      />
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      overflow: "hidden",
      paddingHorizontal: space.gutter,
      paddingBottom: 28,
      gap: 24,
      backgroundColor: colors.blue,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.slate,
    },
    avatarLabel: { color: colors.white, fontSize: 15, fontWeight: "700" },
    greeting: { color: colors.white, fontSize: 32, lineHeight: 34 },
    list: { paddingHorizontal: space.gutter, paddingVertical: 24, gap: 12 },
    titleRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    count: { fontSize: 14 },
    empty: { paddingVertical: 24, textAlign: "center", fontSize: 15 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 12,
      paddingRight: 6,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.muted },
    photo: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: colors.muted,
    },
    itemText: { flex: 1, gap: 4 },
    tagLabel: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
    itemTitle: { fontSize: 16, lineHeight: 20, fontWeight: "700" },
  })
)
