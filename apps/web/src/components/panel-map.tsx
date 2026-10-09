import * as React from "react"
import L from "leaflet"
import { LocateFixedIcon, MinusIcon, PlusIcon } from "lucide-react"
import Supercluster from "supercluster"

import { cn } from "@workspace/ui/lib/utils"

import ideogram from "@/assets/logo/ideogram.svg"
import { useT } from "@/lib/language"
import type { Panel, Position, View } from "@/lib/places"

import "leaflet/dist/leaflet.css"

// Metropolitan France: the view the map opens on.
const initialBounds = L.latLngBounds([41.3, -5.2], [51.1, 9.6])

// Width the panel sheet takes on the right of the map, margins included.
export const sheetInset = 428

function panelIcon(selected: boolean) {
  const size = selected ? 52 : 38

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: `<img src="${ideogram}" alt="" class="size-full rounded-full border-3 border-white bg-white shadow-sm ${selected ? "outline-4 outline-aura-slate" : ""}">`,
  })
}

function clusterIcon(count: number) {
  const size = count < 10 ? 50 : 56

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: `<span class="grid size-full place-items-center rounded-full border-6 border-aura-slate/25 bg-aura-slate bg-clip-padding text-base font-bold text-white">${count}</span>`,
  })
}

const controlButton =
  "grid size-11 place-items-center bg-background text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"

export function PanelMap({
  panels,
  selectedId,
  onSelect,
  around,
  radiusKm,
  onLocate,
  onViewChange,
  controlsClassName,
  className,
}: {
  panels: Panel[]
  selectedId: string | null
  onSelect: (id: string) => void
  around: Position | null
  radiusKm: number
  onLocate: () => void
  // Called with what the map shows, at start and after each move or zoom.
  onViewChange: (view: View) => void
  controlsClassName?: string
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const markersRef = React.useRef<L.LayerGroup | null>(null)
  const circleRef = React.useRef<L.Circle | null>(null)
  const onSelectRef = React.useRef(onSelect)
  const t = useT()

  React.useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  const onViewChangeRef = React.useRef(onViewChange)
  React.useEffect(() => {
    onViewChangeRef.current = onViewChange
  }, [onViewChange])

  React.useEffect(() => {
    const map = L.map(containerRef.current!, { zoomControl: false })
    map.fitBounds(initialBounds)
    map.attributionControl.setPosition("bottomleft")
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const report = () => {
      const centre = map.getCenter()
      const bounds = map.getBounds()
      onViewChangeRef.current({
        latitude: centre.lat,
        longitude: centre.lng,
        radius: centre.distanceTo(bounds.getNorthEast()),
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      })
    }
    map.on("moveend", report)
    report()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(containerRef.current!)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // The selected panel is drawn on its own so a cluster never swallows it.
  const selected = panels.find((panel) => panel.id === selectedId) ?? null
  const index = React.useMemo(() => {
    const cluster = new Supercluster<{ panel: Panel }>({ radius: 60 })
    cluster.load(
      panels
        .filter((panel) => panel.id !== selectedId)
        .map((panel) => ({
          type: "Feature",
          properties: { panel },
          geometry: {
            type: "Point",
            coordinates: [panel.longitude, panel.latitude],
          },
        }))
    )

    return cluster
  }, [panels, selectedId])

  React.useEffect(() => {
    const map = mapRef.current!
    const layer = markersRef.current!

    const draw = () => {
      const bounds = map.getBounds()
      const zoom = Math.round(map.getZoom())
      layer.clearLayers()

      for (const feature of index.getClusters(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        zoom
      )) {
        const [longitude, latitude] = feature.geometry.coordinates
        const properties = feature.properties

        if ("cluster" in properties) {
          const count = properties.point_count
          L.marker([latitude, longitude], {
            icon: clusterIcon(count),
            title: t("map.clusterLabel", { count }),
          })
            .on("click", () =>
              map.flyTo(
                [latitude, longitude],
                index.getClusterExpansionZoom(properties.cluster_id)
              )
            )
            .addTo(layer)
        } else {
          const { panel } = properties
          L.marker([latitude, longitude], {
            icon: panelIcon(false),
            title: panel.title,
          })
            .on("click", () => onSelectRef.current(panel.id))
            .addTo(layer)
        }
      }

      if (selected) {
        L.marker([selected.latitude, selected.longitude], {
          icon: panelIcon(true),
          title: t("map.selectedLabel", { title: selected.title }),
          zIndexOffset: 1000,
        }).addTo(layer)
      }
    }

    draw()
    map.on("moveend", draw)

    return () => {
      map.off("moveend", draw)
    }
  }, [index, selected, t])

  // Bring the selected panel into the part of the map the sheet leaves free.
  const selectedLatitude = selected?.latitude
  const selectedLongitude = selected?.longitude
  React.useEffect(() => {
    if (selectedLatitude === undefined || selectedLongitude === undefined) {
      return
    }
    const map = mapRef.current!
    const point = L.latLng(selectedLatitude, selectedLongitude)
    const sheetFits = map.getSize().x >= 2 * sheetInset
    map.flyToBounds(L.latLngBounds(point, point), {
      paddingBottomRight: [sheetFits ? sheetInset : 0, 0],
      maxZoom: Math.max(map.getZoom(), 12),
    })
  }, [selectedLatitude, selectedLongitude])

  React.useEffect(() => {
    const map = mapRef.current!
    circleRef.current?.remove()
    circleRef.current = null

    if (around) {
      const circle = L.circle([around.latitude, around.longitude], {
        radius: radiusKm * 1000,
        color: "#0077b3",
        weight: 2,
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(map)
      circleRef.current = circle
      map.fitBounds(circle.getBounds(), { padding: [24, 24] })
    }
  }, [around, radiusKm])

  return (
    <div className={cn("relative isolate", className)}>
      <div ref={containerRef} className="absolute inset-0 z-0 bg-muted" />
      <div
        className={cn(
          "absolute right-4 bottom-4 z-10 flex flex-col gap-2",
          controlsClassName
        )}
      >
        <div className="flex flex-col overflow-hidden rounded-xl shadow-sm">
          <button
            type="button"
            aria-label={t("map.zoomIn")}
            className={cn(controlButton, "border-b")}
            onClick={() => mapRef.current?.zoomIn()}
          >
            <PlusIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label={t("map.zoomOut")}
            className={controlButton}
            onClick={() => mapRef.current?.zoomOut()}
          >
            <MinusIcon className="size-5" />
          </button>
        </div>
        <button
          type="button"
          aria-label={t("map.centreOnMe")}
          className={cn(controlButton, "rounded-xl shadow-sm")}
          onClick={onLocate}
        >
          <LocateFixedIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
