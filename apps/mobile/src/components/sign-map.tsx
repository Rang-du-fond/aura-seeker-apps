import * as React from "react"
import { Platform, StyleSheet, View } from "react-native"
import { WebView } from "react-native-webview"

import { mapHtml } from "@/map-view/html"
import { useT } from "@/lib/preferences"

// The map is a small web page (Leaflet with OpenStreetMap tiles, see
// src/map-view) shown in a web view; on the web preview, in an iframe. The
// whole map state is sent to the page as JSON each time it changes.

export type MapSign = {
  id: string
  title: string
  latitude: number
  longitude: number
}

export type MapPoint = { latitude: number; longitude: number }

// What the map shows: its rectangle, and the disc (radius in metres) that
// contains it.
export type MapView = MapPoint & {
  radius: number
  south: number
  west: number
  north: number
  east: number
}

type PageMessage =
  | { type: "ready" }
  | { type: "select"; id: string }
  | { type: "move"; latitude: number; longitude: number }
  | ({ type: "view" } & MapView)

// The web view (or iframe) and its JSON bridge, shared by the maps below.
function MapFrame({
  state,
  onMessage,
  title,
}: {
  state: object
  onMessage: (message: PageMessage) => void
  title: string
}) {
  const [ready, setReady] = React.useState(false)
  const webViewRef = React.useRef<WebView>(null)
  const frameRef = React.useRef<HTMLIFrameElement>(null)
  const json = JSON.stringify(state)

  const handle = React.useCallback(
    (data: unknown) => {
      if (typeof data !== "string") {
        return
      }
      const message: PageMessage = JSON.parse(data)
      if (message.type === "ready") {
        setReady(true)
      } else {
        onMessage(message)
      }
    },
    [onMessage]
  )

  React.useEffect(() => {
    if (!ready) {
      return
    }
    if (Platform.OS === "web") {
      frameRef.current?.contentWindow?.postMessage(json, "*")
    } else {
      webViewRef.current?.injectJavaScript(`window.receive(${json}); true;`)
    }
  }, [ready, json])

  React.useEffect(() => {
    if (Platform.OS !== "web") {
      return
    }
    const listener = (event: MessageEvent) => {
      if (event.source === frameRef.current?.contentWindow) {
        handle(event.data)
      }
    }
    window.addEventListener("message", listener)

    return () => window.removeEventListener("message", listener)
  }, [handle])

  if (Platform.OS === "web") {
    return (
      <View style={styles.map}>
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={mapHtml}
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </View>
    )
  }

  return (
    <WebView
      ref={webViewRef}
      style={styles.map}
      originWhitelist={["*"]}
      source={{ html: mapHtml }}
      // Identifies the app to the OpenStreetMap tile servers.
      applicationNameForUserAgent="AuraSeeker/1.0"
      onMessage={({ nativeEvent }) => handle(nativeEvent.data)}
      // Links (the map attribution) must not navigate the map away.
      onShouldStartLoadWithRequest={({ url }) => url.startsWith("about:")}
      setSupportMultipleWindows={false}
      bounces={false}
      scrollEnabled={false}
      overScrollMode="never"
    />
  )
}

// The map of all signs, clustered, with one of them selected.
export function SignMap({
  onSelect,
  onViewChange,
  ...state
}: {
  signs: MapSign[]
  selectedId: string | null
  // The user's position, drawn as a blue dot.
  position: MapPoint | null
  // Centre the map here; change `request` to centre again on the same point.
  focus: (MapPoint & { request: number }) | null
  // The "around a point" filter, drawn as a disc (radius in metres).
  around: (MapPoint & { radius: number }) | null
  onSelect: (id: string) => void
  // Called at start and after each move or zoom.
  onViewChange: (view: MapView) => void
}) {
  const t = useT()
  const onMessage = React.useCallback(
    (message: PageMessage) => {
      if (message.type === "select") {
        onSelect(message.id)
      } else if (message.type === "view") {
        const { type: _type, ...view } = message
        onViewChange(view)
      }
    },
    [onSelect, onViewChange]
  )

  return (
    <MapFrame
      state={state}
      onMessage={onMessage}
      title={t("signMap.mapSigns")}
    />
  )
}

// One position under a pin fixed at the centre of the map. With `onMove` the
// user moves the map under the pin to change it; without, it is a preview.
export function PositionMap({
  position,
  onMove,
}: {
  position: MapPoint
  onMove?: (position: MapPoint) => void
}) {
  const t = useT()
  const state = React.useMemo(
    () => ({
      picker: {
        latitude: position.latitude,
        longitude: position.longitude,
        interactive: Boolean(onMove),
      },
    }),
    [position.latitude, position.longitude, onMove]
  )
  const onMessage = React.useCallback(
    (message: PageMessage) => {
      if (message.type === "move") {
        onMove?.({ latitude: message.latitude, longitude: message.longitude })
      }
    },
    [onMove]
  )

  return (
    <MapFrame
      state={state}
      onMessage={onMessage}
      title={t("signMap.positionSign")}
    />
  )
}

const styles = StyleSheet.create({
  map: { flex: 1 },
})
