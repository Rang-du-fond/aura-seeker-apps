// Reverse geocoding by OpenStreetMap's Nominatim: which town or village a
// position is in. Its usage policy asks for an identified client and at most
// one request per second, so call it once per position, not while moving.
export async function placeName(
  position: { latitude: number; longitude: number },
  signal?: AbortSignal
): Promise<string | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(position.latitude),
    lon: String(position.longitude),
    // Town level: enough for the name, and coarse results are cached better.
    zoom: "13",
    "accept-language": "fr",
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { signal, headers: { "User-Agent": "AuraSeeker/1.0" } }
  )
  if (!response.ok) {
    return null
  }
  const { address }: { address?: Record<string, string> } =
    await response.json()

  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.hamlet ??
    null
  )
}

// Forward geocoding: the position of a town or an address, in France. Call it
// on an explicit user action only (see the usage policy above).
export async function geocode(
  query: string,
  signal?: AbortSignal
): Promise<{ latitude: number; longitude: number } | null> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "fr",
    "accept-language": "fr",
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { signal, headers: { "User-Agent": "AuraSeeker/1.0" } }
  )
  if (!response.ok) {
    throw new Error(`Nominatim: ${response.status}`)
  }
  const [result]: { lat: string; lon: string }[] = await response.json()

  return result
    ? { latitude: Number(result.lat), longitude: Number(result.lon) }
    : null
}
