// Runs inside the map's web view (see scripts/build-map-html.ts). Plain browser JavaScript:
// Leaflet (L), Supercluster and CONFIG are defined by the scripts before it.
// The app sends the whole map state with window.receive(state); this page
// answers with {type: "ready"} once, then:
// - browsing signs: {type: "select", id} on a pin tap, and {type: "view", …}
//   with what the map shows, at start and after each move;
// - picking a position (state.picker): {type: "move", latitude, longitude}
//   each time the map stops under the fixed centre pin.

function send(message) {
  var text = JSON.stringify(message)
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(text)
  } else {
    window.parent.postMessage(text, "*")
  }
}

var logo =
  '<svg viewBox="' +
  CONFIG.ideogram.viewBox +
  '" width="100%" height="100%">' +
  '<path d="' +
  CONFIG.ideogram.disc +
  '" fill="#fff"/>' +
  '<path d="' +
  CONFIG.ideogram.mark +
  '" fill="' +
  CONFIG.blue +
  '" fill-rule="evenodd"/></svg>'

function signIcon(selected) {
  var size = selected ? 52 : 38
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html:
      '<div class="pin' +
      (selected ? " selected" : "") +
      '">' +
      logo +
      "</div>",
  })
}

function clusterIcon(count) {
  var size = count < 10 ? 46 : count < 100 ? 52 : 58
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: '<div class="cluster">' + count + "</div>",
  })
}

var positionIcon = L.divIcon({
  className: "",
  iconSize: [64, 64],
  html: '<div class="position"><div></div></div>',
})

var map = L.map("map", { zoomControl: false })
// The map opens on metropolitan France.
map.fitBounds([
  [41.3, -5.2],
  [51.1, 9.6],
])
map.attributionControl.setPrefix(false)
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map)
var layer = L.layerGroup().addTo(map)

var state = { signs: [], selectedId: null, position: null, focus: null }
var index = new Supercluster({ radius: 60 })
var picking = false
var pickerPin = null
var lastFocus = null
var lastAround = null
var aroundCircle = null

function draw() {
  // Nothing to draw while picking a position: the pin is a fixed overlay.
  if (picking) {
    return
  }
  var bounds = map.getBounds()
  layer.clearLayers()

  index
    .getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      Math.round(map.getZoom())
    )
    .forEach(function (feature) {
      var latLng = [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      ]
      var properties = feature.properties

      if (properties.cluster) {
        L.marker(latLng, { icon: clusterIcon(properties.point_count) })
          .on("click", function () {
            map.flyTo(
              latLng,
              index.getClusterExpansionZoom(properties.cluster_id)
            )
          })
          .addTo(layer)
      } else {
        L.marker(latLng, { icon: signIcon(false), title: properties.title })
          .on("click", function () {
            send({ type: "select", id: properties.id })
          })
          .addTo(layer)
      }
    })

  // The selected sign is drawn on its own so a cluster never swallows it.
  var selected = state.signs.filter(function (sign) {
    return sign.id === state.selectedId
  })[0]
  if (selected) {
    L.marker([selected.latitude, selected.longitude], {
      icon: signIcon(true),
      zIndexOffset: 1000,
    }).addTo(layer)
  }
  if (state.position) {
    L.marker([state.position.latitude, state.position.longitude], {
      icon: positionIcon,
      interactive: false,
      zIndexOffset: -1000,
    }).addTo(layer)
  }
}

// Picker mode: the pin stays at the centre of the view and the map moves
// under it. `interactive: false` shows the position without letting it move.

function receivePicker(picker) {
  if (!picking) {
    picking = true
    map.setView([picker.latitude, picker.longitude], 18, { animate: false })
    pickerPin = document.createElement("div")
    pickerPin.className = "picker"
    pickerPin.innerHTML = '<div class="pin selected">' + logo + "</div>"
    document.body.appendChild(pickerPin)
    map.on("moveend", function () {
      var centre = map.getCenter()
      send({ type: "move", latitude: centre.lat, longitude: centre.lng })
    })
  } else if (!picker.interactive) {
    // A preview follows the position it is given.
    map.setView([picker.latitude, picker.longitude], map.getZoom(), {
      animate: false,
    })
  }
  ;["dragging", "touchZoom", "doubleClickZoom", "scrollWheelZoom"].forEach(
    function (handler) {
      map[handler][picker.interactive ? "enable" : "disable"]()
    }
  )
}

window.receive = function (next) {
  if (next.picker) {
    receivePicker(next.picker)
    return
  }
  state = next
  index = new Supercluster({ radius: 60 })
  index.load(
    state.signs
      .filter(function (sign) {
        return sign.id !== state.selectedId
      })
      .map(function (sign) {
        return {
          type: "Feature",
          properties: { id: sign.id, title: sign.title },
          geometry: {
            type: "Point",
            coordinates: [sign.longitude, sign.latitude],
          },
        }
      })
  )

  // The "around a point" filter: a disc, framed when it changes.
  var around = state.around
  var aroundKey = around
    ? [around.latitude, around.longitude, around.radius].join(",")
    : null
  if (aroundKey !== lastAround) {
    lastAround = aroundKey
    if (aroundCircle) {
      aroundCircle.remove()
      aroundCircle = null
    }
    if (around) {
      aroundCircle = L.circle([around.latitude, around.longitude], {
        radius: around.radius,
        color: CONFIG.blueText,
        weight: 2,
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(map)
      map.fitBounds(aroundCircle.getBounds(), { padding: [16, 16] })
    }
  }
  // `request` changes each time the app asks to centre, even on the same point.
  if (state.focus && state.focus.request !== lastFocus) {
    lastFocus = state.focus.request
    map.flyTo(
      [state.focus.latitude, state.focus.longitude],
      Math.max(map.getZoom(), 14)
    )
  }
  draw()
}

// Tell the app what the map shows, so it loads the signs of that area: the
// view's rectangle and the radius of the disc that contains it.
function reportView() {
  if (picking) {
    return
  }
  var centre = map.getCenter()
  var bounds = map.getBounds()
  send({
    type: "view",
    latitude: centre.lat,
    longitude: centre.lng,
    radius: centre.distanceTo(bounds.getNorthEast()),
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  })
}

map.on("moveend", draw)
map.on("moveend", reportView)
window.addEventListener("resize", function () {
  map.invalidateSize()
})
// The web preview talks to this page through postMessage.
window.addEventListener("message", function (event) {
  if (typeof event.data === "string") {
    window.receive(JSON.parse(event.data))
  }
})
send({ type: "ready" })
reportView()
