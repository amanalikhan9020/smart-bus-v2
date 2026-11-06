/* Real, source-attributed stop coordinates. Missing locations are never inferred. */
(() => {
  "use strict";
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const script = document.currentScript;
  const dataURL = new URL("data/astana-stops.json", script ? script.src : document.baseURI);
  if (script && script.src) dataURL.search = new URL(script.src).search;
  let dataset = null;
  let pending = null;
  let generation = 0;

  function requiredText(value, label, limit = 2000) {
    if (typeof value !== "string" || !value.trim() || value.length > limit) {
      throw new Error("The stop dataset has invalid " + label + ".");
    }
    return value;
  }
  function validate(raw) {
    if (!raw || raw.schemaVersion !== 1 || !raw.source || !Array.isArray(raw.stops) ||
        !raw.stops.length || raw.stops.length > 20000) {
      throw new Error("The published stop dataset is missing or invalid.");
    }
    const source = {
      name: requiredText(raw.source.name, "source name", 500),
      url: requiredText(raw.source.url, "source URL"),
      license: requiredText(raw.source.license, "source license", 500),
      retrievedAt: requiredText(raw.source.retrievedAt, "retrieval date", 100),
      coverage: requiredText(raw.source.coverage, "coverage description")
    };
    if (new URL(source.url).protocol !== "https:") throw new Error("The stop source URL must use HTTPS.");
    const byId = Object.create(null);
    const stops = raw.stops.map(item => {
      const id = requiredText(item && item.id, "stop identifier", 200);
      if (hasOwn(byId, id) || !Number.isFinite(item.lat) || !Number.isFinite(item.lon) ||
          item.lat < 50.5 || item.lat > 51.7 || item.lon < 70.7 || item.lon > 72.5) {
        throw new Error("The stop dataset has duplicate identifiers or coordinates outside the Astana area.");
      }
      const stop = Object.freeze({
        id, name: requiredText(item.name, "stop name", 500), lat: item.lat, lon: item.lon
      });
      byId[id] = stop;
      return stop;
    });
    const routeMatches = Object.create(null);
    const suppliedMatches = raw.routeMatches || {};
    if (typeof suppliedMatches !== "object" || Array.isArray(suppliedMatches)) {
      throw new Error("The stop dataset has invalid route matches.");
    }
    Object.keys(suppliedMatches).forEach(routeId => {
      const routes = window.SmartBusModel && window.SmartBusModel.ROUTES;
      const route = routes && hasOwn(routes, routeId) ? routes[routeId] : null;
      const matches = suppliedMatches[routeId];
      if (!route || !matches || typeof matches !== "object" || Array.isArray(matches)) {
        throw new Error("The stop dataset references an unknown route.");
      }
      const clean = Object.create(null);
      Object.keys(matches).forEach(index => {
        const numeric = Number(index);
        const stopId = matches[index];
        if (!/^\d+$/.test(index) || !Number.isInteger(numeric) || numeric >= route.stops.length ||
            typeof stopId !== "string" || !hasOwn(byId, stopId)) {
          throw new Error("The stop dataset has an invalid route-to-stop match.");
        }
        clean[index] = stopId;
      });
      routeMatches[routeId] = Object.freeze(clean);
    });
    const latitudes = stops.map(stop => stop.lat);
    const longitudes = stops.map(stop => stop.lon);
    return Object.freeze({
      schemaVersion: 1, source: Object.freeze(source), stops: Object.freeze(stops),
      routeMatches: Object.freeze(routeMatches), byId: Object.freeze(byId),
      bounds: [[Math.min(...latitudes), Math.min(...longitudes)], [Math.max(...latitudes), Math.max(...longitudes)]]
    });
  }

  async function load({ force = false } = {}) {
    if (dataset && !force) return dataset;
    if (pending && !force) return pending;
    const attempt = ++generation;
    const request = (async () => {
      let response;
      try { response = await fetch(dataURL.href, { cache: "no-cache", credentials: "same-origin" }); }
      catch { throw new Error("Could not load the real stop dataset. Check the connection and retry."); }
      if (!response.ok) throw new Error("The stop dataset could not be loaded (HTTP " + response.status + ").");
      let raw;
      try { raw = await response.json(); }
      catch { throw new Error("The published stop dataset is not valid JSON."); }
      const clean = validate(raw);
      if (attempt === generation) dataset = clean;
      return clean;
    })();
    pending = request;
    try { return await request; }
    finally { if (pending === request) pending = null; }
  }

  function getRouteStops(routeId) {
    if (!dataset) return [];
    const routes = window.SmartBusModel.ROUTES;
    if (!hasOwn(routes, routeId)) return [];
    const matches = hasOwn(dataset.routeMatches, routeId) ? dataset.routeMatches[routeId] : {};
    return routes[routeId].stops.map((name, index) => hasOwn(matches, index) ? dataset.byId[matches[index]] : null);
  }

  window.SmartBusMapData = Object.freeze({
    bounds: [[51.0, 71.25], [51.23, 71.55]],
    description: "Historic source coordinates; unmatched route stops have no inferred location.",
    load, getData: () => dataset, getRouteStops,
    getCoordinates: routeId => getRouteStops(routeId).map(stop => stop ? [stop.lat, stop.lon] : null)
  });
})();
