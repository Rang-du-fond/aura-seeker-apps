import * as React from "react"
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import Slider from "@react-native-community/slider"
import {
  CheckIcon,
  LocateFixedIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Checkbox } from "@workspace/ui/native/checkbox"
import { Chip } from "@workspace/ui/native/chip"
import { IconButton } from "@workspace/ui/native/icon-button"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, shadow } from "@workspace/ui/native/tokens"

import { LogoMark } from "@/components/logo"
import type { MapPoint } from "@/components/sign-map"
import type { TagUsage } from "@/lib/api"
import { api } from "@/lib/client"
import { geocode } from "@/lib/geocode"
import { useCount, useT } from "@/lib/preferences"

export const defaultRadiusKm = 25

// What the map is filtered by. `text` looks in titles; a sign must carry every
// tag; `around` keeps the signs within `radiusKm` of a place; `liked` keeps
// the signs the user likes.
export type MapFilters = {
  text: string
  tags: string[]
  around: (MapPoint & { label: string }) | null
  radiusKm: number
  liked: boolean
}

export const noFilters: MapFilters = {
  text: "",
  tags: [],
  around: null,
  radiusKm: defaultRadiusKm,
  liked: false,
}

// The search bar over the map: one card that grows downwards when focused to
// hold the filter form (proposed tags, around a place, radius, likes), and shrinks
// back to the bar when closed. Closed, the active filters show as chips
// under it.
export function MapSearch({
  filters,
  onChange,
  onUseMyPosition,
  top,
}: {
  filters: MapFilters
  onChange: (filters: MapFilters) => void
  // Asks for the device's position; null when it is not available.
  onUseMyPosition: () => Promise<MapPoint | null>
  top: number
}) {
  const t = useT()
  const count = useCount()
  const colors = useColors()
  const styles = useStyles()
  const inputRef = React.useRef<TextInput>(null)
  const [open, setOpen] = React.useState(false)
  const [place, setPlace] = React.useState(filters.around?.label ?? "")
  const [placeMessage, setPlaceMessage] = React.useState<string | null>(null)
  const { text, tags, around, radiusKm, liked } = filters

  // Tags matching the text, searched on the server shortly after typing.
  const [found, setFound] = React.useState<TagUsage[]>([])
  const search = text.trim()
  React.useEffect(() => {
    if (!search) {
      return
    }
    let cancelled = false
    const timer = setTimeout(
      () =>
        api
          .tags(search)
          .then((matching) => !cancelled && setFound(matching))
          .catch(() => {}),
      250
    )

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])
  const suggestions = search
    ? found
        .filter(({ name }) => !tags.includes(name))
        .sort((a, b) => b.places - a.places)
        .slice(0, 5)
    : []

  function close() {
    setOpen(false)
    Keyboard.dismiss()
    inputRef.current?.blur()
  }

  function setAround(point: MapPoint | null, label = "") {
    onChange({ ...filters, around: point ? { ...point, label } : null })
  }

  async function searchPlace() {
    setPlaceMessage(null)
    if (!place.trim()) {
      setAround(null)
      return
    }
    try {
      const point = await geocode(place.trim())
      if (point) {
        setAround(point, place.trim())
      } else {
        setPlaceMessage(t("Lieu introuvable."))
      }
    } catch {
      setPlaceMessage(t("Recherche de lieu indisponible."))
    }
  }

  async function useMyPosition() {
    setPlaceMessage(null)
    const point = await onUseMyPosition()
    if (point) {
      setPlace(t("Ma position"))
      setAround(point, t("Ma position"))
    } else {
      setPlaceMessage(t("Position indisponible."))
    }
  }

  const remove = <XIcon color={colors.primaryForeground} size={14} />
  const active = tags.length > 0 || around !== null || liked

  return (
    <View style={[styles.holder, { top }]} pointerEvents="box-none">
      {/* One card: the bar, which grows to hold the form when focused. */}
      <View style={[styles.card, open && styles.cardOpen, shadow.card]}>
        <View style={styles.bar}>
          <LogoMark size={36} />
          <TextInput
            ref={inputRef}
            accessibilityLabel={t("Rechercher")}
            placeholder={t("Rechercher un panneau…")}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            autoCorrect={false}
            value={text}
            onChangeText={(value) => onChange({ ...filters, text: value })}
            onFocus={() => setOpen(true)}
            onSubmitEditing={close}
            style={styles.input}
          />
          {open ? (
            <IconButton
              label={t("Fermer")}
              size={40}
              backgroundColor={colors.muted}
              icon={(props) => <XIcon {...props} />}
              onPress={close}
            />
          ) : (
            <IconButton
              label={t("Filtres")}
              size={40}
              backgroundColor={active ? colors.primary : colors.muted}
              color={active ? colors.primaryForeground : undefined}
              icon={(props) => <SlidersHorizontalIcon {...props} />}
              onPress={() => setOpen(true)}
            />
          )}
        </View>

        {open && (
          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.length > 0 && (
              <View style={styles.section}>
                <Text variant="label">{t("Tags associés")}</Text>
                <View style={styles.suggestions}>
                  {suggestions.map(({ name, places }) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityLabel={t("Ajouter le tag {tag}", {
                        tag: name,
                      })}
                      style={({ pressed }) => [
                        styles.suggestion,
                        pressed && styles.pressed,
                      ]}
                      onPress={() =>
                        // The tag replaces the text that led to it.
                        onChange({
                          ...filters,
                          text: "",
                          tags: [...tags, name],
                        })
                      }
                    >
                      <PlusIcon color={colors.link} size={18} />
                      <Text style={styles.suggestionLabel}>{name}</Text>
                      <Text variant="muted">
                        {count(places, "{count} panneau", "{count} panneaux")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {tags.length > 0 && (
              <View style={styles.section}>
                <Text variant="label">{t("Tags")}</Text>
                <View style={styles.chips}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      removeLabel={t("Retirer le tag {tag}", { tag })}
                      removeIcon={() => remove}
                      onRemove={() =>
                        onChange({
                          ...filters,
                          tags: tags.filter((other) => other !== tag),
                        })
                      }
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <Field label={t("Autour de")} hint={placeMessage ?? undefined}>
              <View style={styles.placeRow}>
                <View style={styles.placeInput}>
                  <Input
                    placeholder={t("Commune ou adresse")}
                    returnKeyType="search"
                    autoCorrect={false}
                    value={place}
                    onChangeText={setPlace}
                    onSubmitEditing={searchPlace}
                    submitBehavior="submit"
                  />
                </View>
                <IconButton
                  label={t("Utiliser ma position")}
                  size={52}
                  backgroundColor={colors.muted}
                  icon={(props) => <LocateFixedIcon {...props} size={22} />}
                  onPress={useMyPosition}
                />
              </View>
            </Field>

            <View style={[styles.section, !around && styles.disabled]}>
              <View style={styles.radiusLabel}>
                <Text variant="label">{t("Rayon")}</Text>
                <Text variant="label">{radiusKm} km</Text>
              </View>
              <Slider
                accessibilityLabel={t("Rayon")}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={radiusKm}
                disabled={!around}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                onSlidingComplete={(value) =>
                  onChange({ ...filters, radiusKm: Math.round(value) })
                }
              />
            </View>

            <Checkbox
              checked={liked}
              onCheckedChange={(checked) =>
                onChange({ ...filters, liked: checked })
              }
              label={t("Seulement les panneaux que j'aime")}
              checkIcon={(props) => <CheckIcon {...props} strokeWidth={3} />}
            >
              <Text>{t("Seulement les panneaux que j'aime")}</Text>
            </Checkbox>

            {(active || search !== "") && (
              <Button
                variant="ghost"
                size="sm"
                style={styles.reset}
                onPress={() => {
                  setPlace("")
                  setPlaceMessage(null)
                  onChange(noFilters)
                }}
              >
                {t("Réinitialiser")}
              </Button>
            )}
          </ScrollView>
        )}
      </View>

      {!open && active && (
        <View style={styles.chips} pointerEvents="box-none">
          {tags.map((tag) => (
            <Chip
              key={tag}
              removeLabel={t("Retirer le tag {tag}", { tag })}
              removeIcon={() => remove}
              onRemove={() =>
                onChange({
                  ...filters,
                  tags: tags.filter((other) => other !== tag),
                })
              }
            >
              {tag}
            </Chip>
          ))}
          {around && (
            <Chip
              removeLabel={t("Retirer le filtre par lieu")}
              removeIcon={() => remove}
              onRemove={() => {
                setPlace("")
                setAround(null)
              }}
            >
              {`${around.label} · ${radiusKm} km`}
            </Chip>
          )}
          {liked && (
            <Chip
              removeLabel={t("Retirer le filtre par j'aime")}
              removeIcon={() => remove}
              onRemove={() => onChange({ ...filters, liked: false })}
            >
              {t("Mes j'aime")}
            </Chip>
          )}
        </View>
      )}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    holder: { position: "absolute", left: 16, right: 16, gap: 8 },
    card: {
      overflow: "hidden",
      // Half the bar's height: a pill when closed.
      borderRadius: 26,
      backgroundColor: colors.card,
    },
    cardOpen: { borderRadius: radius.xl },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 6,
      paddingLeft: 8,
    },
    input: {
      flex: 1,
      minWidth: 0,
      height: 40,
      fontSize: 15,
      color: colors.foreground,
    },
    form: {
      maxHeight: 420,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    formContent: { gap: 16, padding: 16 },
    section: { gap: 8 },
    suggestions: {
      overflow: "hidden",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 12,
    },
    pressed: { backgroundColor: colors.muted },
    suggestionLabel: { flex: 1 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    placeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    placeInput: { flex: 1 },
    radiusLabel: { flexDirection: "row", justifyContent: "space-between" },
    disabled: { opacity: 0.5 },
    reset: { alignSelf: "flex-end", paddingHorizontal: 12 },
  })
)
