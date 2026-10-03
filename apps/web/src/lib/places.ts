// Panels ("places" in the API). Field names follow the API's Place schema.
export type Panel = {
  id: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  tags: string[]
  createdAt: string
  imageUrl: string | null
  authorId: string | null
}

export type Position = { latitude: number; longitude: number }

// "/api" is proxied to the API by Vite (see vite.config.ts): the API sends no
// CORS headers, so the browser has to reach it on the app's own origin.
const apiUrl = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "")

type ApiPlace = {
  id: string
  title: string
  description?: string | null
  latitude: number
  longitude: number
  image: string
  tags?: string[]
  created_at: string
  author?: string
}

type HalCollection<T> = { _embedded: Record<string, T[]> }

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { signal })
  if (!response.ok) {
    throw new Error(`GET ${path}: ${response.status}`)
  }

  return response.json()
}

async function getCollection<T>(path: string, signal?: AbortSignal) {
  const body = await getJson<HalCollection<T>>(path, signal)

  return Object.values(body._embedded).flat()
}

// A figure is null when the API does not provide it (an older API version).
export type Statistics = {
  total: number
  lastThirtyDays: number | null
  tags: number | null
  contributors: number | null
}

// The API computes every figure (GET /places/statistics).
export async function getStatistics(signal?: AbortSignal): Promise<Statistics> {
  const statistics = await getJson<{
    total: number
    added_last_30_days?: number
    tags_used?: number
    contributors?: number
  }>("/places/statistics", signal)

  return {
    total: statistics.total,
    lastThirtyDays: statistics.added_last_30_days ?? null,
    tags: statistics.tags_used ?? null,
    contributors: statistics.contributors ?? null,
  }
}

function toPanel(place: ApiPlace): Panel {
  return {
    id: place.id,
    title: place.title,
    description: place.description ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    tags: place.tags ?? [],
    createdAt: place.created_at,
    imageUrl: `${apiUrl}/files/${place.image}/content`,
    authorId: place.author ?? null,
  }
}

// A disc on the map: `radius` in metres around the point.
export type Area = Position & { radius: number }

// What a map shows: its rectangle, and the disc that contains it (the API
// searches around a point, not inside a rectangle).
export type View = Area & {
  south: number
  west: number
  north: number
  east: number
}

export type PanelSearch = {
  // Text the title must contain.
  title?: string
  // Tags the panel must all carry.
  tags?: string[]
  authorId?: string
  // ISO date-time: only panels created after it.
  after?: string
  // Only panels inside this disc, nearest to its centre first.
  area?: Area
}

// Searches panels on the server (GET /places). The API takes one tag, has no
// result limit and no rectangular view box: further tags are checked here, and
// a map view is searched as the disc that contains it.
export async function searchPanels(
  { title, tags = [], authorId, after, area }: PanelSearch,
  signal?: AbortSignal
): Promise<Panel[]> {
  const params = new URLSearchParams()
  if (title) params.set("title", title)
  if (tags[0]) params.set("tag", tags[0])
  if (authorId) params.set("author", authorId)
  if (after) params.set("after", after)
  if (area) {
    params.set("latitude", String(area.latitude))
    params.set("longitude", String(area.longitude))
    params.set("radius", String(Math.ceil(area.radius)))
  }
  const query = params.toString()
  const places = await getCollection<ApiPlace>(
    query ? `/places?${query}` : "/places",
    signal
  )

  return places
    .map(toPanel)
    .filter((panel) => tags.slice(1).every((tag) => panel.tags.includes(tag)))
}

export async function getPanel(id: string, signal?: AbortSignal) {
  return toPanel(await getJson<ApiPlace>(`/places/${id}`, signal))
}

export type TagUsage = { name: string; places: number }

// Tags whose name contains `query`, with the number of panels that carry
// each (GET /tags?q=).
export function searchTags(query: string, signal?: AbortSignal) {
  return getCollection<TagUsage>(
    `/tags?${new URLSearchParams({ q: query })}`,
    signal
  )
}

export async function getAuthorName(
  authorId: string,
  signal?: AbortSignal
): Promise<string | null> {
  const response = await fetch(`${apiUrl}/users/${authorId}`, { signal })
  if (!response.ok) {
    return null
  }
  const profile: { display_name?: string | null } = await response.json()

  return profile.display_name ?? null
}

// Geocoding by OpenStreetMap's Nominatim. Its usage policy allows one request
// per second at most, so only call it on an explicit user action.
export async function geocode(
  query: string,
  signal?: AbortSignal
): Promise<(Position & { label: string }) | null> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "fr",
    "accept-language": "fr",
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { signal }
  )
  if (!response.ok) {
    throw new Error(`Nominatim: ${response.status}`)
  }
  const [result]: { lat: string; lon: string; display_name: string }[] =
    await response.json()

  return result
    ? {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        label: result.display_name,
      }
    : null
}

export function distanceKm(from: Position, to: Position) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = radians(to.latitude - from.latitude)
  const dLng = radians(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(dLng / 2) ** 2

  return 6371 * 2 * Math.asin(Math.sqrt(a))
}
