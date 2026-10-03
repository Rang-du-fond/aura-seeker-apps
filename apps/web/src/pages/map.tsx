import * as React from "react"
import {
  ImageIcon,
  LocateFixedIcon,
  MapPinIcon,
  SearchIcon,
  Share2Icon,
  TagIcon,
  XIcon,
} from "lucide-react"
import { useSearchParams } from "react-router"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Slider } from "@workspace/ui/components/slider"
import { Text } from "@workspace/ui/components/text"
import { cn } from "@workspace/ui/lib/utils"

import { PanelMap } from "@/components/panel-map"
import {
  distanceKm,
  geocode,
  getAuthorName,
  getPanel,
  searchTags,
  searchPanels,
  type Area,
  type View,
  type Panel,
  type Position,
} from "@/lib/places"

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" })
const defaultRadiusKm = 25
// The map shows every result; the list stays short to remain usable.
const maxListed = 50
const aroundParams = ["near", "lat", "lng"]

// The value, once it has stopped changing for `delay` milliseconds.
function useDebounced<Value>(value: Value, delay: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function Map() {
  const [panels, setPanels] = React.useState<Panel[] | null>(null)
  const [loadFailed, setLoadFailed] = React.useState(false)
  // The filters and the selection live in the query string, so a URL restores
  // the whole view: ?q=&tag=&tag=&near=&lat=&lng=&radius=&author=&sign=
  const [searchParams, setSearchParams] = useSearchParams()
  const setParams = React.useCallback(
    (mutate: (params: URLSearchParams) => void) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          mutate(next)
          return next
        },
        { replace: true }
      ),
    [setSearchParams]
  )
  const query = searchParams.get("q") ?? ""
  const tags = React.useMemo(() => searchParams.getAll("tag"), [searchParams])
  const latitude = Number.parseFloat(searchParams.get("lat") ?? "")
  const longitude = Number.parseFloat(searchParams.get("lng") ?? "")
  const around = React.useMemo<Position | null>(
    () =>
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : null,
    [latitude, longitude]
  )
  const radiusKm = Math.min(
    Math.max(
      Number.parseInt(searchParams.get("radius") ?? "") || defaultRadiusKm,
      1
    ),
    100
  )
  const authorId = searchParams.get("author")
  const authorName = useAuthorName(authorId)
  const selectedId = searchParams.get("sign")
  // Drafts: what is being typed, before it becomes a filter.
  const [tagQuery, setTagQuery] = React.useState("")
  const [near, setNear] = React.useState(searchParams.get("near") ?? "")
  const [nearMessage, setNearMessage] = React.useState<string | null>(null)

  function setQuery(value: string) {
    setParams((params) => (value ? params.set("q", value) : params.delete("q")))
  }

  function setTags(next: string[]) {
    setParams((params) => {
      params.delete("tag")
      next.forEach((tag) => params.append("tag", tag))
    })
  }

  function setAround(position: Position | null, label = "") {
    setParams((params) => {
      if (position) {
        params.set("near", label)
        params.set("lat", position.latitude.toFixed(5))
        params.set("lng", position.longitude.toFixed(5))
      } else {
        aroundParams.forEach((name) => params.delete(name))
      }
    })
  }

  // Only reachable from a panel's sheet: the form has no author field.
  function setAuthor(id: string | null) {
    setParams((params) =>
      id ? params.set("author", id) : params.delete("author")
    )
  }

  function setRadiusKm(value: number) {
    setParams((params) =>
      value === defaultRadiusKm
        ? params.delete("radius")
        : params.set("radius", String(value))
    )
  }

  // The search runs on the server: by title, tag and author, inside the
  // "Autour de" disc when there is one, otherwise inside what the map shows.
  // Each move of the map searches again, for what it now shows. The view is
  // debounced so a quick series of zooms makes one request.
  const [liveView, setView] = React.useState<View | null>(null)
  const view = useDebounced(liveView, 250)
  const title = useDebounced(query.trim(), 300)
  // The tag list as one string: a stable value for the search to depend on.
  const tagsKey = tags.join("\n")
  // Around a point, the map view plays no part in the search.
  const searchedView = around ? null : view
  const area = React.useMemo<Area | null>(
    () => (around ? { ...around, radius: radiusKm * 1000 } : searchedView),
    [around, radiusKm, searchedView]
  )

  React.useEffect(() => {
    if (!area) {
      return
    }
    const controller = new AbortController()
    searchPanels(
      {
        title,
        tags: tagsKey ? tagsKey.split("\n") : [],
        authorId: authorId ?? undefined,
        area,
      },
      controller.signal
    )
      .then((found) => {
        setPanels(found)
        setLoadFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadFailed(true)
        }
      })

    return () => controller.abort()
  }, [title, tagsKey, authorId, area])

  // Tag suggestions are searched on the server as the user types.
  const tagSearch = useDebounced(tagQuery.trim(), 250)
  const [serverTags, setServerTags] = React.useState<{
    query: string
    counts: Record<string, number>
  } | null>(null)
  React.useEffect(() => {
    if (!tagSearch) {
      return
    }
    const controller = new AbortController()
    searchTags(tagSearch, controller.signal)
      .then((found) =>
        setServerTags({
          query: tagSearch,
          counts: Object.fromEntries(
            found.map(({ name, places }) => [name, places])
          ),
        })
      )
      // Without an answer, suggestions come from the panels on screen.
      .catch(() => {})

    return () => controller.abort()
  }, [tagSearch])

  const select = React.useCallback(
    (id: string | null) =>
      setParams((params) =>
        id ? params.set("sign", id) : params.delete("sign")
      ),
    [setParams]
  )

  const tagCounts = React.useMemo(() => {
    // The server's answer, once it matches what is typed.
    if (serverTags && serverTags.query === tagQuery.trim()) {
      return serverTags.counts
    }
    const counts: Record<string, number> = {}
    for (const panel of panels ?? []) {
      for (const tag of panel.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }

    return counts
  }, [serverTags, tagQuery, panels])

  const suggestions = tagQuery.trim()
    ? Object.keys(tagCounts)
        .filter(
          (tag) =>
            !tags.includes(tag) &&
            normalize(tag).includes(normalize(tagQuery.trim()))
        )
        .sort((a, b) => tagCounts[b] - tagCounts[a])
        .slice(0, 5)
    : []

  // The server has already filtered and, around a point, sorted by distance.
  // For a map view it answers with the disc around it: keep what is inside.
  const results = React.useMemo(
    () =>
      (panels ?? [])
        .filter(
          (panel) =>
            around ||
            !view ||
            (panel.latitude >= view.south &&
              panel.latitude <= view.north &&
              panel.longitude >= view.west &&
              panel.longitude <= view.east)
        )
        .map((panel) => ({
          panel,
          distance: around ? distanceKm(around, panel) : null,
        })),
    [panels, around, view]
  )

  // The open panel may be outside the results (another area, other filters):
  // it is then read on its own.
  const found = panels?.find((panel) => panel.id === selectedId) ?? null
  const [fetched, setFetched] = React.useState<Panel | null>(null)
  const missing = selectedId !== null && panels !== null && !found
  React.useEffect(() => {
    if (!missing || !selectedId) {
      return
    }
    const controller = new AbortController()
    getPanel(selectedId, controller.signal)
      .then(setFetched)
      .catch(() => {})

    return () => controller.abort()
  }, [missing, selectedId])
  const selected = found ?? (fetched?.id === selectedId ? fetched : null)
  // The open panel stays on the map even when the filters exclude it.
  const visiblePanels = React.useMemo(() => {
    const matching = results.map(({ panel }) => panel)

    return selected && !matching.includes(selected)
      ? [...matching, selected]
      : matching
  }, [results, selected])

  function addTag(tag: string) {
    setTags([...tags, tag])
    setTagQuery("")
  }

  function locate() {
    setNearMessage(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setAround(
          { latitude: coords.latitude, longitude: coords.longitude },
          "Ma position"
        )
        setNear("Ma position")
      },
      () => setNearMessage("Position indisponible.")
    )
  }

  async function searchNear(event: React.FormEvent) {
    event.preventDefault()
    setNearMessage(null)
    if (!near.trim()) {
      setAround(null)
      return
    }
    try {
      const place = await geocode(near)
      setAround(place, near.trim())
      if (!place) {
        setNearMessage("Lieu introuvable.")
      }
    } catch {
      setNearMessage("Recherche de lieu indisponible.")
    }
  }

  function reset() {
    setParams((params) =>
      ["q", "tag", "radius", "author", ...aroundParams].forEach((name) =>
        params.delete(name)
      )
    )
    setTagQuery("")
    setNear("")
    setNearMessage(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside
        aria-label="Recherche et filtres"
        className="flex flex-col gap-5 border-b p-6 lg:w-[400px] lg:flex-none lg:overflow-y-auto lg:border-r lg:border-b-0"
      >
        <h1 className="sr-only">Carte des panneaux</h1>

        <Field>
          <FieldLabel htmlFor="q">Rechercher</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="q"
              type="search"
              placeholder="Intitulé du panneau…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="tags">Tags</FieldLabel>
          <div>
            <InputGroup
              className={cn(suggestions.length > 0 && "rounded-b-none")}
            >
              <InputGroupAddon>
                <TagIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="tags"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls="tag-suggestions"
                autoComplete="off"
                placeholder="Ajouter un tag…"
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && suggestions[0]) {
                    addTag(suggestions[0])
                  }
                }}
              />
            </InputGroup>
            {suggestions.length > 0 && (
              <ul
                id="tag-suggestions"
                role="listbox"
                className="flex flex-col rounded-b-lg border border-t-0 border-input bg-background p-1.5"
              >
                {suggestions.map((tag, index) => (
                  <li key={tag} role="option" aria-selected={index === 0}>
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-10 w-full items-center justify-between rounded-md px-2.5 text-left text-[15px] outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring",
                        index === 0 && "bg-accent"
                      )}
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                      <Text variant="muted" asChild>
                        <span>{tagCounts[tag]}</span>
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {tags.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Text variant="muted">
                  {tags.length} tag{tags.length > 1 && "s"} sélectionné
                  {tags.length > 1 && "s"}
                </Text>
                <Button variant="link" size="xs" onClick={() => setTags([])}>
                  Tout effacer
                </Button>
              </div>
              <ul
                aria-label="Tags sélectionnés"
                className="flex flex-wrap gap-2"
              >
                {tags.map((tag) => (
                  <li key={tag}>
                    <Badge className="h-9 gap-1 pr-1 pl-3 text-sm font-semibold">
                      {tag}
                      <button
                        type="button"
                        aria-label={`Retirer le tag ${tag}`}
                        className="grid size-7 place-items-center rounded-full outline-none hover:bg-primary-foreground/20 focus-visible:ring-3 focus-visible:ring-primary-foreground"
                        onClick={() =>
                          setTags(tags.filter((other) => other !== tag))
                        }
                      >
                        <XIcon />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="near">Autour de</FieldLabel>
          <form className="flex gap-2" onSubmit={searchNear}>
            <Input
              id="near"
              placeholder="Commune ou adresse"
              enterKeyHint="search"
              value={near}
              onChange={(event) => setNear(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-lg"
              aria-label="Utiliser ma position"
              onClick={locate}
            >
              <LocateFixedIcon className="size-5" />
            </Button>
          </form>
          {nearMessage && (
            <Text variant="muted" role="status">
              {nearMessage}
            </Text>
          )}
          <label htmlFor="radius" className="mt-1 flex justify-between text-sm">
            Rayon <strong>{radiusKm} km</strong>
          </label>
          <Slider
            id="radius"
            aria-label="Rayon"
            min={1}
            max={100}
            value={[radiusKm]}
            onValueChange={([value]) => setRadiusKm(value)}
            disabled={!around}
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <strong role="status">
            {panels ? results.length : "…"} panneau
            {results.length > 1 && "x"}
          </strong>
          <Button variant="secondary" size="sm" onClick={reset}>
            Réinitialiser
          </Button>
        </div>

        {loadFailed && (
          <Text variant="muted" role="alert">
            Les panneaux n'ont pas pu être chargés.
          </Text>
        )}

        <ul aria-label="Résultats" className="flex flex-col gap-2">
          {results.slice(0, maxListed).map(({ panel, distance }) => (
            <li key={panel.id}>
              <button
                type="button"
                aria-current={panel.id === selectedId || undefined}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring aria-[current]:bg-accent aria-[current]:outline-2 aria-[current]:outline-foreground"
                onClick={() => select(panel.id)}
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 flex-none place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground"
                >
                  {panel.imageUrl ? (
                    <img
                      src={panel.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-4.5" />
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <strong className="truncate text-[15px]">
                    {panel.title}
                  </strong>
                  <Text variant="muted" asChild>
                    <span>
                      {[
                        panel.tags[0],
                        distance !== null && `${distance.toFixed(1)} km`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Text>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {results.length > maxListed && (
          <Text variant="muted">
            Les {maxListed} premiers résultats sont listés. Affinez la recherche
            ou utilisez la carte pour voir les autres.
          </Text>
        )}
      </aside>

      <section
        aria-label="Carte"
        className="relative min-h-[80svh] flex-1 lg:min-h-0"
      >
        <PanelMap
          className="absolute inset-0"
          controlsClassName={selected ? "md:right-[428px]" : undefined}
          panels={visiblePanels}
          selectedId={selectedId}
          onSelect={select}
          around={around}
          radiusKm={radiusKm}
          onLocate={locate}
          onViewChange={setView}
        />

        {/* One chip per active filter, each removable on its own. */}
        <div
          className={cn(
            "absolute top-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-2",
            selected && "md:max-w-[calc(100%-444px)]"
          )}
        >
          {query.trim() && (
            <FilterChip
              label="Retirer la recherche"
              onRemove={() => setQuery("")}
            >
              « {query.trim()} »
            </FilterChip>
          )}
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              label={`Retirer le tag ${tag}`}
              onRemove={() => setTags(tags.filter((other) => other !== tag))}
            >
              {tag}
            </FilterChip>
          ))}
          {around && (
            <FilterChip
              label="Retirer le filtre par lieu"
              onRemove={() => {
                setAround(null)
                setNear("")
              }}
            >
              {searchParams.get("near") || "Autour d'un point"} · {radiusKm} km
            </FilterChip>
          )}
          {authorId && (
            <FilterChip
              label="Retirer le filtre par auteur"
              onRemove={() => setAuthor(null)}
            >
              Recensé par {authorName ?? "…"}
            </FilterChip>
          )}
        </div>

        {selected && (
          <PanelSheet
            key={selected.id}
            panel={selected}
            activeTags={tags}
            onToggleTag={(tag) =>
              setTags(
                tags.includes(tag)
                  ? tags.filter((other) => other !== tag)
                  : [...tags, tag]
              )
            }
            onFilterAuthor={setAuthor}
            onClose={() => select(null)}
          />
        )}
      </section>
    </div>
  )
}

function FilterChip({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-background pr-1 pl-3.5 text-sm font-semibold shadow-sm">
      {children}
      <button
        type="button"
        aria-label={label}
        className="grid size-7 place-items-center rounded-full bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring"
        onClick={onRemove}
      >
        <XIcon className="size-3.5" />
      </button>
    </span>
  )
}

function useAuthorName(authorId: string | null) {
  const [author, setAuthor] = React.useState<{
    id: string
    name: string
  } | null>(null)

  React.useEffect(() => {
    if (!authorId) {
      return
    }
    const controller = new AbortController()
    getAuthorName(authorId, controller.signal)
      .then((name) => name && setAuthor({ id: authorId, name }))
      .catch(() => {})

    return () => controller.abort()
  }, [authorId])

  return author?.id === authorId ? author.name : null
}

function PanelSheet({
  panel,
  activeTags,
  onToggleTag,
  onFilterAuthor,
  onClose,
}: {
  panel: Panel
  activeTags: string[]
  onToggleTag: (tag: string) => void
  onFilterAuthor: (authorId: string) => void
  onClose: () => void
}) {
  const authorName = useAuthorName(panel.authorId)
  const [shared, setShared] = React.useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: panel.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShared(true)
      }
    } catch {
      // Sharing was cancelled.
    }
  }

  return (
    <article
      aria-labelledby="panel-title"
      className="absolute top-4 right-4 bottom-4 z-20 flex w-[396px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[20px] bg-card text-card-foreground shadow-xl"
    >
      <div className="relative grid h-60 flex-none place-items-center bg-aura-blue/15">
        {panel.imageUrl ? (
          <img
            src={panel.imageUrl}
            alt={`Photo du panneau « ${panel.title} »`}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Text variant="muted">Pas de photo</Text>
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label="Fermer la fiche"
          className="absolute top-3 right-3 border-transparent"
          onClick={onClose}
        >
          <XIcon className="size-5" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5.5 pt-5 pb-5.5">
        <Text variant="h2" id="panel-title">
          {panel.title}
        </Text>
        {panel.tags.length > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
            {panel.tags.map((tag) => (
              <li key={tag}>
                <Badge
                  asChild
                  variant={activeTags.includes(tag) ? "default" : "secondary"}
                >
                  <button
                    type="button"
                    aria-pressed={activeTags.includes(tag)}
                    title={
                      activeTags.includes(tag)
                        ? "Retirer ce tag de la recherche"
                        : "Ajouter ce tag à la recherche"
                    }
                    className="cursor-pointer"
                    onClick={() => onToggleTag(tag)}
                  >
                    {tag}
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2.5 text-[15px]">
          <MapPinIcon className="mt-px size-5 flex-none text-link" />
          {Math.abs(panel.latitude).toFixed(5)}°{" "}
          {panel.latitude >= 0 ? "N" : "S"} ·{" "}
          {Math.abs(panel.longitude).toFixed(5)}°{" "}
          {panel.longitude >= 0 ? "E" : "O"}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 border-y py-3.5 text-[15px]">
          <dt className="text-muted-foreground">Ajouté le</dt>
          <dd>{dateFormat.format(new Date(panel.createdAt))}</dd>
          {panel.authorId && authorName && (
            <>
              <dt className="text-muted-foreground">Recensé par</dt>
              <dd>
                <button
                  type="button"
                  title="Voir les panneaux de cet auteur"
                  className="cursor-pointer rounded-sm text-link underline outline-none focus-visible:ring-3 focus-visible:ring-ring"
                  onClick={() => onFilterAuthor(panel.authorId!)}
                >
                  {authorName}
                </button>
              </dd>
            </>
          )}
        </dl>
        {panel.description && (
          <p className="text-[15px] leading-normal">{panel.description}</p>
        )}
        <Button variant="secondary" className="mt-auto" onClick={share}>
          <Share2Icon data-icon="inline-start" />
          {shared ? "Lien copié" : "Partager"}
        </Button>
      </div>
    </article>
  )
}
