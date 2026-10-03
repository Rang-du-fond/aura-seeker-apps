// Scatters points over a rectangle so that they look random but are never
// closer than `minDistance` to each other (Poisson-disc sampling, Bridson's
// algorithm). A plain random scatter clumps and overlaps; a jittered grid shows
// its rows and columns. This gives an even density with no visible structure.
//
// The same `seed` always gives the same points. Points may fall up to
// `minDistance` outside the rectangle, so shapes drawn on them reach the
// edges and get cropped there instead of leaving an empty border.

export type Point = { x: number; y: number }

// Small seeded generator (mulberry32): numbers in [0, 1).
export function seededRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function scatter({
  width,
  height,
  minDistance,
  random,
}: {
  width: number
  height: number
  minDistance: number
  random: () => number
}): Point[] {
  // The area sampled, with the margin that lets points sit past the edges.
  const left = -minDistance
  const top = -minDistance
  const spanX = width + 2 * minDistance
  const spanY = height + 2 * minDistance

  // A grid with cells small enough to hold one point at most: a candidate is
  // checked against the few cells around it, not against every point.
  const cell = minDistance / Math.SQRT2
  const columns = Math.ceil(spanX / cell)
  const rows = Math.ceil(spanY / cell)
  const grid = new Array<Point | undefined>(columns * rows)
  const points: Point[] = []
  // Points around which there may still be room.
  const active: Point[] = []

  const column = (point: Point) => Math.floor((point.x - left) / cell)
  const row = (point: Point) => Math.floor((point.y - top) / cell)

  function add(point: Point) {
    points.push(point)
    active.push(point)
    grid[row(point) * columns + column(point)] = point
  }

  function isFree(point: Point) {
    if (
      point.x < left ||
      point.y < top ||
      point.x >= left + spanX ||
      point.y >= top + spanY
    ) {
      return false
    }
    const c = column(point)
    const r = row(point)
    for (let y = Math.max(r - 2, 0); y <= Math.min(r + 2, rows - 1); y++) {
      for (let x = Math.max(c - 2, 0); x <= Math.min(c + 2, columns - 1); x++) {
        const other = grid[y * columns + x]
        if (
          other &&
          Math.hypot(other.x - point.x, other.y - point.y) < minDistance
        ) {
          return false
        }
      }
    }

    return true
  }

  add({ x: left + random() * spanX, y: top + random() * spanY })

  // Tries per point before deciding there is no room left around it. More
  // tries pack the points tighter.
  const tries = 30
  while (active.length > 0) {
    const index = Math.floor(random() * active.length)
    const origin = active[index]
    let placed = false
    for (let attempt = 0; attempt < tries; attempt++) {
      // A candidate between one and two minimum distances away.
      const angle = random() * 2 * Math.PI
      const distance = minDistance * (1 + random())
      const candidate = {
        x: origin.x + Math.cos(angle) * distance,
        y: origin.y + Math.sin(angle) * distance,
      }
      if (isFree(candidate)) {
        add(candidate)
        placed = true
        break
      }
    }
    if (!placed) {
      active.splice(index, 1)
    }
  }

  return points
}
