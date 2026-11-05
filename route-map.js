/* Interactive Leaflet map with a local schematic when OSM tiles cannot load. */
(() => {
  "use strict";

  const APPROXIMATE = "Stop locations and route lines are approximate demo data, not official CTS routing.";

  function schematicURL() {
    // This local diagram intentionally uses broad geographic context, not a
    // claimed road map. It remains behind OSM tiles as an offline fallback.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100">
      <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#dbe7e7" stroke-width="1"/></pattern></defs>
      <rect width="900" height="1100" fill="#eff5f1"/><rect width="900" height="1100" fill="url(#grid)"/>
      <path d="M0 300C180 390 260 270 410 370S670 500 900 350" fill="none" stroke="#add8ec" stroke-width="34"/>
      <path d="M0 300C180 390 260 270 410 370S670 500 900 350" fill="none" stroke="#d3edf8" stroke-width="18"/>
      <g fill="#cce3cc" opacity=".7"><ellipse cx="260" cy="370" rx="100" ry="55"/><ellipse cx="570" cy="530" rx="80" ry="100"/><ellipse cx="370" cy="740" rx="70" ry="60"/></g>
      <g font-family="sans-serif" text-anchor="middle" fill="#75888d"><text x="440" y="240" font-size="36" letter-spacing="8">ASTANA</text><text x="610" y="425" font-size="20">Esil River · schematic</text><text x="450" y="940" font-size="20">Approximate city context</text><text x="450" y="975" font-size="16">Not a street map or official route</text></g>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function create({ containerId = "routeMap", onSelectStop = () => {} } = {}) {
    const container = document.getElementById(containerId);
    const status = document.getElementById("mapStatus");
    const selection = document.getElementById("mapSelection");
    const setStatus = text => { if (status) status.textContent = text; };
    if (!container || !window.L || !window.SmartBusMapData || !window.SmartBusModel) {
      setStatus("The interactive map could not be loaded. Use the route and stop selectors to plan your trip.");
      return null;
    }

    const L = window.L;
    const data = window.SmartBusMapData;
    const bounds = L.latLngBounds(data.bounds);
    const map = L.map(container, {
      zoomControl: false, minZoom: 10, maxZoom: 18, zoomSnap: 0.25,
      scrollWheelZoom: false, keyboard: true, attributionControl: true,
      maxBounds: bounds.pad(0.5), maxBoundsViscosity: 0.6
    });
    const updateMarkerDensity = () => {
      container.classList.toggle("map-compact-markers", map.getZoom() < 12.5);
    };
    map.on("zoomend", updateMarkerDensity);
    map.setView([51.12, 71.43], 11);
    updateMarkerDensity();
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    map.createPane("schematicPane").style.zIndex = "150";
    L.imageOverlay(schematicURL(), bounds, { pane: "schematicPane", interactive: false, opacity: 1 }).addTo(map);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 10, maxZoom: 18, bounds: bounds.pad(0.1),
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    let tileFailed = false;
    tiles.on("tileerror", () => {
      tileFailed = true;
      setStatus("Map tiles unavailable. Showing the local schematic background; stop locations and route lines are approximate demo data.");
    });
    tiles.on("load", () => {
      if (!tileFailed) setStatus("OpenStreetMap background. " + APPROXIMATE);
    });
    tiles.addTo(map);
    setStatus("Loading OpenStreetMap background. " + APPROXIMATE);

    const routeLayer = L.layerGroup().addTo(map);
    let currentRouteId = null;
    let routeBounds = bounds;
    let markers = [];
    let selectedIndex = 0;

    function selectStop(index) {
      const route = window.SmartBusModel.ROUTES[currentRouteId];
      if (!route || !Number.isInteger(index) || !route.stops[index]) return;
      const changed = selectedIndex !== index;
      selectedIndex = index;
      markers.forEach((marker, markerIndex) => {
        const selected = markerIndex === index;
        if (!selected && marker.isPopupOpen()) marker.closePopup();
        marker.setZIndexOffset(selected ? 2000 : 0);
        const el = marker.getElement();
        if (el) {
          el.classList.toggle("is-selected", selected);
          el.setAttribute("aria-pressed", String(selected));
          el.dataset.stopIndex = String(markerIndex);
          el.setAttribute("aria-label", `Stop ${markerIndex + 1}: ${route.stops[markerIndex]}${selected ? ", selected" : ""}. Approximate location.`);
        }
      });
      if (changed) map.panInside(markers[index].getLatLng(), { padding: [30, 30], animate: false });
      if (selection) selection.textContent = `${route.name} · Stop ${index + 1} of ${route.stops.length} · ${route.stops[index]}`;
    }

    function fitRoute() {
      map.invalidateSize({ pan: false });
      map.fitBounds(routeBounds, { padding: [24, 24], maxZoom: 14, animate: false });
    }

    function setRoute(routeId, index = 0) {
      const routes = window.SmartBusModel.ROUTES;
      const route = Object.hasOwn(routes, routeId) ? routes[routeId] : null;
      if (!route) return;
      if (routeId === currentRouteId && markers.length) { selectStop(index); return; }
      const coordinates = data.getCoordinates(routeId, route.stops.length);
      currentRouteId = routeId;
      routeLayer.clearLayers();
      markers = [];
      L.polyline(coordinates, { color: "#ffffff", weight: 8, opacity: 0.9, interactive: false }).addTo(routeLayer);
      L.polyline(coordinates, { color: "#2f6df6", weight: 4, opacity: 0.95, dashArray: "8 5", interactive: false }).addTo(routeLayer);
      route.stops.forEach((name, stopIndex) => {
        const endpoint = stopIndex === 0 || stopIndex === route.stops.length - 1;
        const icon = L.divIcon({
          className: "route-stop-marker" + (endpoint ? " is-route-endpoint" : ""),
          html: `<span aria-hidden="true">${stopIndex + 1}</span>`,
          iconSize: [26, 26], iconAnchor: [13, 13]
        });
        const marker = L.marker(coordinates[stopIndex], {
          icon, keyboard: true, title: `Stop ${stopIndex + 1}: ${name} (approximate)`,
          alt: `Stop ${stopIndex + 1}: ${name}`
        });
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = name;
        const note = document.createElement("p");
        note.textContent = `${route.name} · Stop ${stopIndex + 1} · Approximate demo location`;
        popup.append(title, note);
        marker.bindPopup(popup);
        marker.on("click", () => {
          selectStop(stopIndex);
          onSelectStop(stopIndex);
        });
        marker.addTo(routeLayer);
        // DivIcon markers are focusable, but keyboard activation must use the
        // same selection callback as a pointer click, not just open a popup.
        marker.getElement()?.addEventListener("keydown", event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          marker.fire("click", { originalEvent: event });
        });
        markers.push(marker);
      });
      routeBounds = L.latLngBounds(coordinates);
      selectStop(index);
      fitRoute();
    }

    const bind = (id, action) => document.getElementById(id)?.addEventListener("click", action);
    bind("mapZoomIn", () => map.zoomIn());
    bind("mapZoomOut", () => map.zoomOut());
    bind("mapFitRoute", fitRoute);

    // Updating a forecast does not reset zoom. A route change explicitly fits
    // the new route, while selection simply highlights a marker.
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) map.invalidateSize({ pan: false });
    }) : null;
    resizeObserver?.observe(container);

    return Object.freeze({
      setRoute, selectStop, fitRoute,
      invalidateSize: () => map.invalidateSize({ pan: false }),
      getSelectedIndex: () => selectedIndex
    });
  }

  window.SmartBusRouteMap = Object.freeze({ create });
})();
