/* Source-backed stop map. No coordinates or road-route geometry are invented. */
(() => {
  "use strict";
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  function create({ containerId = "routeMap", onSelectStop = () => {} } = {}) {
    const container = document.getElementById(containerId);
    const status = document.getElementById("mapStatus");
    const selection = document.getElementById("mapSelection");
    const sourceLink = document.getElementById("mapDataSource");
    const setStatus = text => { if (status) status.textContent = text; };
    if (!container || !window.L || !window.SmartBusMapData || !window.SmartBusModel) {
      if (container) container.dataset.mapState = "error";
      setStatus("The map library could not load. Use the stop selector while the map is unavailable.");
      return null;
    }
    const L = window.L;
    const data = window.SmartBusMapData;
    const defaultBounds = L.latLngBounds(data.bounds);
    container.dataset.mapState = "loading";
    container.style.backgroundColor = "#eef2f5";
    container.style.backgroundImage = "linear-gradient(#dce3e8 1px,transparent 1px),linear-gradient(90deg,#dce3e8 1px,transparent 1px)";
    container.style.backgroundSize = "40px 40px";
    const map = L.map(container, {
      zoomControl: false, minZoom: 9, maxZoom: 18, zoomSnap: 0.25,
      scrollWheelZoom: false, keyboard: true, attributionControl: true,
      maxBounds: defaultBounds.pad(1), maxBoundsViscosity: 0.6
    }).setView([51.12, 71.43], 11);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    map.attributionControl.addAttribution("Historic stop coordinates: see dataset source");
    const updateMarkerDensity = () => container.classList.toggle("map-compact-markers", map.getZoom() < 12.5);
    map.on("zoomend", updateMarkerDensity);
    updateMarkerDensity();
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 9, maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const sourceLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    let tileFailed = false;
    let loaded = null;
    let loadError = "";
    let currentRouteId = null;
    let selectedIndex = 0;
    let sourceBounds = defaultBounds;
    let routeBounds = defaultBounds;
    let routeMarkers = [];
    let requestNumber = 0;

    function updateStatus() {
      if (loadError) { setStatus(loadError); return; }
      if (!loaded) { setStatus("Loading real stop coordinates from the published research dataset…"); return; }
      const route = currentRouteId && window.SmartBusModel.ROUTES[currentRouteId];
      const matched = routeMarkers.filter(Boolean).length;
      const background = tileFailed
        ? "Street map tiles unavailable. Real stop coordinates remain visible on the coordinate grid. "
        : "OpenStreetMap street background. ";
      setStatus(background + loaded.stops.length + " source stops loaded. " +
        (route ? matched + " of " + route.stops.length + " " + route.name + " stop names have a verified source match. " : "") +
        "Historical dataset with partial coverage; no road route or current bus service is inferred.");
    }
    tiles.on("tileerror", () => { tileFailed = true; updateStatus(); });
    tiles.on("load", updateStatus);
    tiles.addTo(map);

    function popupFor(stop, routeDescription) {
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = stop.name;
      const details = document.createElement("p");
      details.textContent = routeDescription || "Published stop location. This dataset does not confirm that the selected bus serves this stop.";
      const coordinates = document.createElement("p");
      coordinates.textContent = "Coordinates: " + stop.lat.toFixed(6) + ", " + stop.lon.toFixed(6);
      const source = document.createElement("a");
      source.textContent = loaded.source.name;
      source.href = loaded.source.url;
      source.target = "_blank"; source.rel = "noopener noreferrer";
      const license = document.createElement("p");
      license.textContent = "Source license: " + loaded.source.license + ". Historical data, not a live position.";
      popup.append(title, details, coordinates, source, license);
      return popup;
    }
    function bindKeyboard(marker, action) {
      const el = marker.getElement();
      if (!el) return;
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault(); event.stopPropagation(); action(event);
      });
    }
    function updateSelection(pan = false) {
      const routes = window.SmartBusModel.ROUTES;
      const route = currentRouteId && hasOwn(routes, currentRouteId) ? routes[currentRouteId] : null;
      if (!route || !route.stops[selectedIndex]) return;
      routeMarkers.forEach((marker, index) => {
        if (!marker) return;
        const selected = index === selectedIndex;
        marker.setZIndexOffset(selected ? 2000 : 0);
        if (!selected && marker.isPopupOpen()) marker.closePopup();
        const el = marker.getElement();
        if (el) {
          el.classList.toggle("is-selected", selected);
          el.setAttribute("aria-pressed", String(selected));
          el.setAttribute("aria-label", "Stop " + (index + 1) + ": " + route.stops[index] +
            (selected ? ", selected" : "") + ". Historical source coordinates.");
        }
      });
      const marker = routeMarkers[selectedIndex];
      if (pan && marker) map.panInside(marker.getLatLng(), { padding: [30, 30], animate: false });
      if (selection) selection.textContent = route.name + " · Stop " + (selectedIndex + 1) + " of " + route.stops.length +
        " · " + route.stops[selectedIndex] + (loaded && !marker ? " · No verified location for this stop in the source dataset." : loaded ? " · Source-matched location" : " · Loading location…");
    }
    function selectStop(index) {
      const route = currentRouteId && window.SmartBusModel.ROUTES[currentRouteId];
      if (!route || !Number.isInteger(index) || !route.stops[index]) return;
      const changed = selectedIndex !== index;
      selectedIndex = index;
      updateSelection(changed);
    }
    function fitRoute() {
      map.invalidateSize({ pan: false });
      map.fitBounds(routeBounds, { padding: [28, 28], maxZoom: 14, animate: false });
    }
    function renderRoute(fit = true) {
      routeLayer.clearLayers();
      routeMarkers = [];
      if (!loaded || !currentRouteId) { updateSelection(); return; }
      const route = window.SmartBusModel.ROUTES[currentRouteId];
      const matches = data.getRouteStops(currentRouteId);
      const points = [];
      matches.forEach((stop, index) => {
        if (!stop) return;
        const marker = L.marker([stop.lat, stop.lon], {
          icon: L.divIcon({
            className: "route-stop-marker" + (index === 0 || index === route.stops.length - 1 ? " is-route-endpoint" : ""),
            html: '<span aria-hidden="true">' + (index + 1) + "</span>",
            iconSize: [26, 26], iconAnchor: [13, 13]
          }),
          keyboard: true, title: "Stop " + (index + 1) + ": " + route.stops[index] + " (source matched)"
        });
        marker.bindPopup(popupFor(stop, route.name + " · Project stop " + (index + 1) + ": " + route.stops[index] + ". Name-matched location; current service is not verified."));
        marker.on("click", () => { selectStop(index); onSelectStop(index); });
        marker.addTo(routeLayer);
        marker.getElement().dataset.stopIndex = String(index);
        marker.getElement().dataset.sourceId = stop.id;
        bindKeyboard(marker, event => marker.fire("click", { originalEvent: event }));
        routeMarkers[index] = marker;
        points.push([stop.lat, stop.lon]);
      });
      routeBounds = points.length ? L.latLngBounds(points) : sourceBounds;
      updateSelection(); updateStatus();
      if (fit) fitRoute();
    }
    function setRoute(routeId, index = 0) {
      const routes = window.SmartBusModel.ROUTES;
      if (!hasOwn(routes, routeId)) return;
      const changed = currentRouteId !== routeId;
      currentRouteId = routeId;
      selectedIndex = Number.isInteger(index) && routes[routeId].stops[index] ? index : 0;
      if (changed) renderRoute(true);
      else updateSelection();
    }
    function renderSource() {
      sourceLayer.clearLayers();
      loaded.stops.forEach(stop => {
        const marker = L.circleMarker([stop.lat, stop.lon], {
          radius: 4, color: "#586b7d", weight: 1, fillColor: "#a8b7c6", fillOpacity: 0.8,
          className: "source-stop-marker"
        }).bindPopup(popupFor(stop));
        marker.addTo(sourceLayer);
        const el = marker.getElement();
        if (el) { el.dataset.sourceId = stop.id; el.setAttribute("aria-label", stop.name + ". Historical source stop."); }
        bindKeyboard(marker, () => marker.openPopup());
      });
      sourceBounds = L.latLngBounds(loaded.bounds);
      if (sourceLink) {
        sourceLink.href = loaded.source.url;
        sourceLink.textContent = loaded.source.name + " · " + loaded.source.license;
        sourceLink.target = "_blank"; sourceLink.rel = "noopener noreferrer";
        sourceLink.removeAttribute("hidden");
      }
    }
    async function loadStops(force = false) {
      const attempt = ++requestNumber;
      loadError = ""; container.dataset.mapState = "loading"; updateStatus();
      try {
        const result = await data.load({ force });
        if (attempt !== requestNumber) return;
        loaded = result;
        renderSource(); renderRoute(true);
        container.dataset.mapState = "ready";
        updateStatus();
      } catch (error) {
        if (attempt !== requestNumber) return;
        loadError = error.message + " No locations have been invented. You can still use the route and time selectors.";
        container.dataset.mapState = "error";
        updateStatus();
      }
    }
    const bind = (id, action) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", action);
    };
    bind("mapZoomIn", () => map.zoomIn());
    bind("mapZoomOut", () => map.zoomOut());
    bind("mapFitRoute", fitRoute);
    bind("mapRetryBtn", () => loadStops(true));
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) map.invalidateSize({ pan: false });
    }) : null;
    if (observer) observer.observe(container);
    loadStops();
    return Object.freeze({
      setRoute, selectStop, fitRoute,
      invalidateSize: () => map.invalidateSize({ pan: false }),
      getSelectedIndex: () => selectedIndex,
      reloadData: () => loadStops(true)
    });
  }
  window.SmartBusRouteMap = Object.freeze({ create });
})();
