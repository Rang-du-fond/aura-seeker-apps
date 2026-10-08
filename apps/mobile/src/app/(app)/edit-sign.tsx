import * as React from "react"
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { CheckIcon, Trash2Icon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, space } from "@workspace/ui/native/tokens"

import { ScreenHeader } from "@/components/screen-header"
import { TagField } from "@/components/tag-field"
import { ApiError, type Place } from "@/lib/api"
import { api } from "@/lib/client"
import { useKeyboardVisible } from "@/lib/keyboard"
import { useT } from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

// Asks before a destructive action. Alert has no web implementation, so the
// browser preview falls back to window.confirm.
function confirm(
  title: string,
  message: string,
  action: string,
  cancel: string
) {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`))
  }

  return new Promise<boolean>((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: "cancel", onPress: () => resolve(false) },
        { text: action, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  )
}

// Lets the author change a sign's title, tags and comment, or delete it. The
// photo and the position are sent back unchanged: the API replaces the whole
// sign.
export default function EditSign() {
  const t = useT()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const keyboardVisible = useKeyboardVisible()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [place, setPlace] = React.useState<Place | null>(null)
  const [title, setTitle] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [comment, setComment] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    api
      .place(id)
      .then((loaded) => {
        if (!cancelled) {
          setPlace(loaded)
          setTitle(loaded.title)
          setTags(loaded.tags)
          setComment(loaded.description ?? "")
        }
      })
      .catch(
        () => !cancelled && setError(t("Le panneau n'a pas pu être chargé."))
      )

    return () => {
      cancelled = true
    }
  }, [id])

  async function save() {
    if (!place) {
      return
    }
    if (!title.trim()) {
      setError(t("Donnez un intitulé au panneau."))
      return
    }
    setError(null)
    setPending(true)
    try {
      await api.updatePlace({
        id: place.id,
        latitude: place.latitude,
        longitude: place.longitude,
        image: place.image,
        title: title.trim(),
        tags,
        description: comment.trim() || null,
      })
      router.back()
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === "network"
          ? t("Impossible de joindre le serveur. Rien n'a été enregistré.")
          : caught instanceof ApiError && caught.status === 401
            ? t("Votre session a expiré. Reconnectez-vous pour enregistrer.")
            : caught instanceof ApiError && caught.status === 403
              ? t("Seul l'auteur du panneau peut le modifier.")
              : t(
                  "Les modifications n'ont pas pu être enregistrées. Réessayez."
                )
      )
      setPending(false)
    }
  }

  async function remove() {
    if (!place) {
      return
    }
    const confirmed = await confirm(
      t("Supprimer ce panneau ?"),
      t("Il sera retiré de la carte et de vos contributions."),
      t("Supprimer"),
      t("Annuler")
    )
    if (!confirmed) {
      return
    }
    setError(null)
    setPending(true)
    try {
      await api.deletePlace(place.id)
      router.back()
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? t("Votre session a expiré. Reconnectez-vous pour supprimer.")
          : t("Le panneau n'a pas pu être supprimé. Réessayez.")
      )
      setPending(false)
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScreenHeader title={t("Modifier le panneau")} backLabel={t("Annuler")} />

      {/* The form and its button move up with the keyboard. */}
      <KeyboardAvoidingView behavior="padding" style={styles.form}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {place ? (
            <>
              <Image
                source={{ uri: api.imageUrl(place.image) }}
                accessibilityLabel={t("Photo du panneau")}
                style={styles.photo}
              />
              <Field label={t("Intitulé du panneau")}>
                <Input value={title} onChangeText={setTitle} />
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
              <Button
                variant="destructive"
                icon={(props) => <Trash2Icon {...props} />}
                disabled={pending}
                onPress={remove}
              >
                {t("Supprimer le panneau")}
              </Button>
            </>
          ) : (
            !error && <Text variant="muted">{t("Chargement…")}</Text>
          )}
        </ScrollView>

        {/* Above the keyboard there is no navigation bar to stay clear of. */}
        <View
          style={[
            styles.footer,
            { paddingBottom: keyboardVisible ? 12 : insets.bottom + 16 },
          ]}
        >
          {error && (
            <Text
              accessibilityRole="alert"
              variant="label"
              style={styles.error}
            >
              {error}
            </Text>
          )}
          <Button
            size="lg"
            icon={(props) => <CheckIcon {...props} />}
            disabled={!place || pending}
            onPress={save}
          >
            {pending ? t("Enregistrement…") : t("Enregistrer")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    form: { flex: 1 },
    content: { padding: space.gutter, paddingTop: 18, gap: 18 },
    photo: {
      height: 160,
      borderRadius: radius.lg,
      backgroundColor: colors.muted,
    },
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
