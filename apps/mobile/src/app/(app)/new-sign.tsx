import * as React from "react"
import { Image, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Redirect, router } from "expo-router"
import { RotateCcwIcon, SendIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, space } from "@workspace/ui/native/tokens"

import { ScreenHeader } from "@/components/screen-header"
import { PositionMap } from "@/components/sign-map"
import { TagField } from "@/components/tag-field"
import { ApiError } from "@/lib/api"
import { api } from "@/lib/client"
import { formatCoordinates, useDraft } from "@/lib/draft"
import { placeName } from "@/lib/geocode"
import { readPhoto } from "@/lib/photo"
import { useT } from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

export default function NewSign() {
  const t = useT()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [comment, setComment] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const { draft, reset } = useDraft()

  const { photoUri, position } = draft

  // The town or village the sign is in becomes a tag by default. It follows
  // the position if that is adjusted, and the user can remove it like any
  // other tag: it is not added back for the same place.
  const suggestedTag = React.useRef<string | null>(null)
  const latitude = position?.latitude
  const longitude = position?.longitude
  React.useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      return
    }
    const controller = new AbortController()
    placeName({ latitude, longitude }, controller.signal)
      .then((name) => {
        const tag = name?.toLowerCase() ?? null
        const previous = suggestedTag.current
        if (!tag || tag === previous) {
          return
        }
        suggestedTag.current = tag
        setTags((current) => [
          ...current.filter((other) => other !== previous && other !== tag),
          tag,
        ])
      })
      // Without an answer the form simply has no default tag.
      .catch(() => {})

    return () => controller.abort()
  }, [latitude, longitude])

  // Opened without a photo and a position (e.g. by a deep link): start over.
  if (!photoUri || !position) {
    return <Redirect href="/capture" />
  }

  async function publish() {
    if (!title.trim()) {
      setError(t("Donnez un intitulé au panneau."))
      return
    }
    setError(null)
    setPending(true)
    try {
      const photo = await readPhoto(photoUri!)
      const image = await api.uploadImage(photo.body, photo.type)
      const place = await api.createPlace({
        title: title.trim(),
        latitude: position!.latitude,
        longitude: position!.longitude,
        image,
        tags,
        ...(comment.trim() && { description: comment.trim() }),
      })
      // Navigate first: resetting the draft would redirect this screen.
      router.replace({
        pathname: "/success",
        params: { id: place.id, title: place.title, image: place.image },
      })
      reset()
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === "network"
          ? t(
              "Impossible de joindre le serveur. Le panneau n'a pas été publié."
            )
          : caught instanceof ApiError && caught.status === 401
            ? t("Votre session a expiré. Reconnectez-vous pour publier.")
            : t("Le panneau n'a pas pu être publié. Réessayez.")
      )
      setPending(false)
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScreenHeader
        title={t("Nouveau panneau")}
        backLabel={t("Retour aux photos")}
        trailing={
          <Text variant="muted" style={styles.step}>
            {t("Étape 2 / 2")}
          </Text>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View accessibilityLabel={t("Photo")} style={styles.photo}>
          <Image
            source={{ uri: photoUri }}
            accessibilityLabel={t("Photo du panneau")}
            style={StyleSheet.absoluteFill}
          />
          <Button
            size="sm"
            inverted
            icon={(props) => <RotateCcwIcon {...props} size={16} />}
            style={styles.retake}
            onPress={() => router.back()}
          >
            {t("Reprendre")}
          </Button>
        </View>

        <View accessibilityLabel={t("Position")} style={styles.position}>
          {/* A preview: touches go to the scroll view, not the map. */}
          <View pointerEvents="none" style={styles.miniMap}>
            <PositionMap position={position} />
          </View>
          <View style={styles.positionRow}>
            <View style={styles.positionText}>
              <Text variant="label">{formatCoordinates(position)}</Text>
              <Text variant="muted">
                {draft.adjusted
                  ? t("Position ajustée à la main")
                  : position.accuracy !== null
                    ? `±${Math.round(position.accuracy)} m`
                    : t("Position GPS")}
              </Text>
            </View>
            <Button
              size="sm"
              variant="ghost"
              style={styles.adjust}
              onPress={() => router.push("/adjust-position")}
            >
              {t("Ajuster")}
            </Button>
          </View>
        </View>

        <Field label={t("Intitulé du panneau")}>
          <Input
            placeholder={t("Ex. : Ici, la Région finance…")}
            value={title}
            onChangeText={setTitle}
          />
        </Field>

        <TagField tags={tags} onChange={setTags} />

        <Field label={t("Commentaire")} optional={t("(facultatif)")}>
          <Input
            placeholder={t("Remarques sur le panneau…")}
            multiline
            value={comment}
            onChangeText={setComment}
          />
        </Field>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {error && (
          <Text accessibilityRole="alert" variant="label" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          size="lg"
          icon={(props) => <SendIcon {...props} />}
          disabled={pending}
          onPress={publish}
        >
          {pending ? t("Publication…") : t("Publier le panneau")}
        </Button>
      </View>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    step: { paddingRight: 8, fontSize: 14 },
    content: { padding: space.gutter, paddingTop: 18, gap: 18 },
    photo: {
      height: 120,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    retake: {
      position: "absolute",
      right: 10,
      bottom: 10,
      height: 36,
      paddingHorizontal: 12,
    },
    position: {
      overflow: "hidden",
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniMap: { height: 140, backgroundColor: colors.muted },
    adjust: { paddingHorizontal: 8 },
    positionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    positionText: { flex: 1, gap: 2 },
    error: { color: colors.destructive, textAlign: "center" },
    footer: {
      paddingTop: 12,
      paddingHorizontal: space.gutter,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  })
)
