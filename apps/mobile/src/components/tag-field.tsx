import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { PlusIcon, SearchIcon, XIcon } from "lucide-react-native"

import { Chip } from "@workspace/ui/native/chip"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius } from "@workspace/ui/native/tokens"

import type { TagUsage } from "@/lib/api"
import { api } from "@/lib/client"
import { useT } from "@/lib/preferences"

const maxSuggestions = 5

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// A sign's tags: a search over the existing tags (with the option to create a
// new one) and, below it, the selected tags as removable chips.
export function TagField({
  tags,
  onChange: setTags,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const [tagDraft, setTagDraft] = React.useState("")

  // Existing tags matching what is typed, searched on the server shortly
  // after the last keystroke. If the search fails, the field still lets the
  // user create tags.
  const [knownTags, setKnownTags] = React.useState<TagUsage[]>([])
  const search = tagDraft.trim()
  React.useEffect(() => {
    if (!search) {
      return
    }
    let cancelled = false
    const timer = setTimeout(
      () =>
        api
          .tags(search)
          .then((found) => !cancelled && setKnownTags(found))
          .catch(() => {}),
      250
    )

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const tagQuery = tagDraft.trim()
  const suggestions = tagQuery
    ? knownTags
        .filter(
          ({ name }) =>
            !tags.includes(name) &&
            normalize(name).includes(normalize(tagQuery))
        )
        .sort((a, b) => b.places - a.places)
        .slice(0, maxSuggestions)
    : []
  // Offer to create the tag unless it exists or is already selected.
  const canCreate =
    tagQuery !== "" &&
    ![...knownTags.map(({ name }) => name), ...tags].some(
      (name) => normalize(name) === normalize(tagQuery)
    )

  function addTag(tag: string) {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagDraft("")
  }

  return (
    <Field label={t("common.tags")}>
      <Input
        placeholder={t("tagField.searchPlaceholder")}
        accessibilityLabel={t("tagField.search")}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        leading={<SearchIcon color={colors.mutedForeground} size={20} />}
        value={tagDraft}
        onChangeText={setTagDraft}
        // Enter takes the first result, or creates the tag.
        onSubmitEditing={() => {
          const first = suggestions[0]?.name ?? (canCreate ? tagQuery : null)
          if (first) {
            addTag(first)
          }
        }}
        submitBehavior="submit"
      />
      {(suggestions.length > 0 || canCreate) && (
        <View
          accessibilityLabel={t("tagField.results")}
          style={styles.suggestions}
        >
          {suggestions.map(({ name, places }) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={t("common.addTag", { tag: name })}
              style={({ pressed }) => [
                styles.suggestion,
                pressed && styles.suggestionPressed,
              ]}
              onPress={() => addTag(name)}
            >
              <Text style={styles.suggestionLabel}>{name}</Text>
              <Text variant="muted">
                {t("common.signCount", { count: places })}
              </Text>
            </Pressable>
          ))}
          {canCreate && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("tagField.createTag", { tag: tagQuery })}
              style={({ pressed }) => [
                styles.suggestion,
                pressed && styles.suggestionPressed,
              ]}
              onPress={() => addTag(tagQuery)}
            >
              <PlusIcon color={colors.link} size={18} />
              <Text style={[styles.suggestionLabel, styles.create]}>
                {t("tagField.create", { tag: tagQuery })}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {tags.length > 0 && (
        <View
          accessibilityLabel={t("tagField.selectedTags")}
          style={styles.tags}
        >
          {tags.map((tag) => (
            <Chip
              key={tag}
              removeLabel={t("common.removeTag", { tag })}
              removeIcon={(props) => <XIcon {...props} strokeWidth={2.5} />}
              onRemove={() => setTags(tags.filter((other) => other !== tag))}
            >
              {tag}
            </Chip>
          ))}
        </View>
      )}
    </Field>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
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
      paddingHorizontal: 14,
      backgroundColor: colors.background,
    },
    suggestionPressed: { backgroundColor: colors.muted },
    suggestionLabel: { flex: 1 },
    create: { color: colors.link, fontWeight: "600" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  })
)
