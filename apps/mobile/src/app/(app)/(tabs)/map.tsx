import * as React from "react"
import { Image, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Location from "expo-location"
import { useFocusEffect, useLocalSearchParams } from "expo-router"
import { HeartIcon, InfoIcon, NavigationIcon } from "lucide-react-native"

import { Badge } from "@workspace/ui/native/badge"
import { IconButton } from "@workspace/ui/native/icon-button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius, shadow } from "@workspace/ui/native/tokens"

import { MapSearch, noFilters, type MapFilters } from "@/components/map-search"
import { SignMap, type MapPoint, type MapView } from "@/components/sign-map"
import type { Place } from "@/lib/api"
import { api } from "@/lib/client"
import { useLikes } from "@/lib/likes"
import { useLocale, useT } from "@/lib/preferences"
import { useUser } from "@/lib/session"
import { StatusBar } from "@/components/status-bar"

// The value, once it has stopped changing for `delay` milliseconds.
function useDebounced<Value>(value: Value, delay: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function distance(from: MapPoint, to: MapPoint) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const a =
    Math.sin(radians(to.latitude - from.latitude) / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(radians(to.longitude - from.longitude) / 2) ** 2
  const metres = 6371000 * 2 * Math.asin(Math.sqrt(a))

  return metres < 1000
    ? `${Math.round(metres / 10) * 10} m`
    : `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km`
}

export default function Map() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const user = useUser()
  const { isLiked, toggle } = useLikes()
  const [places, setPlaces] = React.useState<Place[]>([])
  const [loadFailed, setLoadFailed] = React.useState(false)
  const [filters, setFilters] = React.useState<MapFilters>(noFilters)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  // The selected sign's card can be opened to read its comment; it closes
  // again when another sign is selected.
  const [detailed, setDetailed] = React.useState(false)
  React.useEffect(() => setDetailed(false), [selectedId])
  // Display names of the authors whose signs were opened, by user id; null
  // for an author without one.
  const [authors, setAuthors] = React.useState<Record<string, string | null>>(
    {}
  )
  // Measured, to keep the "locate" button just above the card.
  const [cardHeight, setCardHeight] = React.useState(120)
  const locale = useLocale()
  const [position, setPosition] = React.useState<MapPoint | null>(null)
  const [focus, setFocus] = React.useState<
    (MapPoint & { request: number }) | null
  >(null)

  // The signs come from the server, for what the map shows: each move of the
  // map searches again. The view and the text are debounced so a burst of
  // zooms or keystrokes makes one request.
  const [liveView, setView] = React.useState<MapView | null>(null)
  const view = useDebounced(liveView, 250)
  const search = useDebounced(filters.text.trim(), 300)
  // Bumped each time the tab is shown, so a sign just added is there.
  const [shown, setShown] = React.useState(0)
  useFocusEffect(React.useCallback(() => setShown((count) => count + 1), []))

  // Around a place, that disc is searched and the map view plays no part.
  const { around, radiusKm } = filters
  const aroundArea = React.useMemo(
    () =>
      around
        ? {
            latitude: around.latitude,
            longitude: around.longitude,
            radius: radiusKm * 1000,
          }
        : null,
    [around, radiusKm]
  )
  const searchedView = aroundArea ? null : view
  const tagsKey = filters.tags.join("\n")
  const likedBy = filters.liked ? user.id : undefined

  React.useEffect(() => {
    const area =
      aroundArea ??
      (searchedView && {
        latitude: searchedView.latitude,
        longitude: searchedView.longitude,
        radius: searchedView.radius,
      })
    if (!area) {
      return
    }
    let cancelled = false
    const tags = tagsKey ? tagsKey.split("\n") : []
    // The API takes one tag: the others are checked here.
    api
      .places({ title: search || undefined, tag: tags[0], likedBy, area })
      .then((loaded) => {
        if (!cancelled) {
          setPlaces(
            loaded.filter((place) =>
              tags.slice(1).every((tag) => place.tags.includes(tag))
            )
          )
          setLoadFailed(false)
        }
      })
      .catch(() => !cancelled && setLoadFailed(true))

    return () => {
      cancelled = true
    }
  }, [aroundArea, searchedView, search, tagsKey, likedBy, shown])

  // The selected sign may be outside what is loaded (another area): it is
  // then read on its own.
  const found = places.find((place) => place.id === selectedId)
  const [fetched, setFetched] = React.useState<Place | null>(null)
  React.useEffect(() => {
    if (!selectedId || found) {
      return
    }
    let cancelled = false
    api
      .place(selectedId)
      .then((place) => !cancelled && setFetched(place))
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [selectedId, found])
  const selected = found ?? (fetched?.id === selectedId ? fetched : undefined)

  // The author's name is read when the detail is opened, once per author.
  const authorId = selected?.author
  const authorName = authorId ? authors[authorId] : undefined
  React.useEffect(() => {
    if (!detailed || !authorId || authorId === user.id || authorId in authors) {
      return
    }
    api
      .profile(authorId)
      .then(({ display_name }) =>
        setAuthors((known) => ({ ...known, [authorId]: display_name }))
      )
      // Without an answer the detail simply has no author.
      .catch(() => {})
  }, [detailed, authorId, user.id, authors])

  // ?sign=<id> opens the map on that sign ("Voir sur la carte").
  const { sign } = useLocalSearchParams<{ sign?: string }>()
  React.useEffect(() => {
    if (sign) {
      setSelectedId(sign)
    }
  }, [sign])
  const centredOn = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (sign && selected?.id === sign && centredOn.current !== sign) {
      centredOn.current = sign
      setFocus({
        latitude: selected.latitude,
        longitude: selected.longitude,
        request: Date.now(),
      })
    }
  }, [sign, selected])

  // What the map draws: the loaded signs inside the view's rectangle (the
  // server answers with the disc around it), plus the selected one.
  const signs = React.useMemo(() => {
    const visible = places.filter(
      (place) =>
        aroundArea ||
        !view ||
        (place.latitude >= view.south &&
          place.latitude <= view.north &&
          place.longitude >= view.west &&
          place.longitude <= view.east)
    )
    if (selected && !visible.includes(selected)) {
      visible.push(selected)
    }

    return visible.map(({ id, title, latitude, longitude }) => ({
      id,
      title,
      latitude,
      longitude,
    }))
  }, [places, view, aroundArea, selected])

  // The device's position, shown on the map; null when it is not available.
  async function findMe() {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync()
      if (!granted) {
        return null
      }
      const { coords } = await Location.getCurrentPositionAsync()
      const point = { latitude: coords.latitude, longitude: coords.longitude }
      setPosition(point)

      return point
    } catch {
      return null
    }
  }

  async function locate() {
    const point = await findMe()
    if (point) {
      setFocus({ ...point, request: Date.now() })
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar />
      <SignMap
        signs={signs}
        selectedId={selectedId}
        position={position}
        focus={focus}
        around={aroundArea}
        onSelect={setSelectedId}
        onViewChange={setView}
      />

      <MapSearch
        filters={filters}
        onChange={setFilters}
        onUseMyPosition={findMe}
        top={insets.top + 8}
      />

      <IconButton
        label={t("map.centreMyPosition")}
        size={48}
        backgroundColor={colors.card}
        icon={(props) => <NavigationIcon {...props} />}
        style={[
          styles.locate,
          shadow.card,
          { bottom: selected ? cardHeight + 36 : 36 },
        ]}
        onPress={locate}
      />

      {loadFailed && (
        <View accessibilityRole="alert" style={[styles.card, shadow.card]}>
          <Text style={styles.cardText}>{t("map.signsCouldNotLoaded")}</Text>
        </View>
      )}

      {selected && (
        <View
          accessibilityLabel={t("map.selectedSign")}
          style={[styles.card, styles.sign, shadow.card]}
          onLayout={({ nativeEvent }) =>
            setCardHeight(nativeEvent.layout.height)
          }
        >
          <View style={styles.summary}>
            <Image
              source={{ uri: api.imageUrl(selected.image) }}
              accessibilityIgnoresInvertColors
              style={styles.photo}
            />
            <View style={styles.cardText}>
              <Text numberOfLines={2} style={styles.cardTitle}>
                {selected.title}
              </Text>
              {position && (
                <Text variant="muted">
                  {t("map.away", {
                    distance: distance(position, selected),
                  })}
                </Text>
              )}
              <View style={styles.tags}>
                {(detailed ? selected.tags : selected.tags.slice(0, 3)).map(
                  (tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  )
                )}
              </View>
            </View>
            <View style={styles.actions}>
              {/* One cannot like one's own sign. */}
              {selected.author !== user.id && (
                <IconButton
                  label={
                    isLiked(selected.id)
                      ? t("map.unlikeSign")
                      : t("map.likeSign")
                  }
                  accessibilityState={{ selected: isLiked(selected.id) }}
                  color={isLiked(selected.id) ? colors.magenta : undefined}
                  icon={({ color, size }) => (
                    <HeartIcon
                      color={color}
                      size={size + 4}
                      fill={isLiked(selected.id) ? color : "none"}
                    />
                  )}
                  onPress={() => toggle(selected.id)}
                />
              )}
              <IconButton
                label={detailed ? t("map.hideDetails") : t("map.showDetails")}
                accessibilityState={{ expanded: detailed }}
                color={detailed ? colors.link : undefined}
                icon={(props) => <InfoIcon {...props} />}
                style={styles.detailButton}
                onPress={() => setDetailed((open) => !open)}
              />
            </View>
          </View>
          {detailed && (
            <View style={styles.detail}>
              <Text style={!selected.description && styles.noComment}>
                {selected.description || t("map.noComment")}
              </Text>
              <Text variant="muted">
                {t(
                  selected.author === user.id
                    ? "map.addedByYou"
                    : authorName
                      ? "map.addedByAuthor"
                      : "map.addedOn",
                  {
                    author: authorName ?? "",
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: "long",
                    }).format(new Date(selected.created_at)),
                  }
                )}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, overflow: "hidden", backgroundColor: colors.muted },
    map: { flex: 1 },
    locate: { position: "absolute", right: 16 },
    card: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 12,
      borderRadius: radius.xl,
      backgroundColor: colors.card,
    },
    photo: {
      width: 96,
      height: 96,
      borderRadius: 14,
      backgroundColor: colors.muted,
    },
    cardText: { flex: 1, gap: 6 },
    // The selected sign: the summary row, then its detail when opened.
    sign: { flexDirection: "column", alignItems: "stretch", gap: 12 },
    summary: { flexDirection: "row", alignItems: "center", gap: 14 },
    actions: { alignSelf: "stretch", justifyContent: "space-between" },
    // Bottom of the column, with or without the heart above it.
    detailButton: { marginTop: "auto" },
    detail: {
      gap: 6,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    noComment: { color: colors.mutedForeground },
    cardTitle: { fontSize: 17, lineHeight: 21, fontWeight: "700" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  })
)
