document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const store = window.SmartBusStore;
  const { ROUTES, compareTrips, calculateOccupancy, getLevel } = window.SmartBusModel;
  let storageReady = false;
  let currentPrediction = null;
  let options = [];
  let modalOpener = null;
  let routeMap = null;

  function message(id, text = "", error = false) {
    $(id).textContent = text;
    $(id).classList.toggle("error", error);
    $(id).classList.toggle("success", !!text && !error);
    if (id === "appMessage") $(id).classList.toggle("hidden", !text);
  }
  function report(error) { message("appMessage", error.message || "An unexpected error occurred. Please reload.", true); }
  function on(id, event, fn, errorId = "appMessage") {
    const control = $(id);
    if (!control) return;
    control.addEventListener(event, async e => {
      try { await fn(e); }
      catch (error) { message(errorId, error.message, true); }
    });
  }
  function requireStorage() {
    if (!storageReady) throw new Error("Local storage is unavailable or could not be migrated. Check the message above and reload after fixing it; existing data has not been discarded.");
  }
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (className) el.className = className;
    return el;
  }
  function attempt(fn) { try { fn(); } catch (error) { report(error); } }

  // Modals: restore focus, support Escape and keep keyboard focus inside the dialog.
  function openModal(id) {
    modalOpener = document.activeElement;
    $(id).classList.remove("hidden");
    $(id).setAttribute("aria-hidden", "false");
    $(id).querySelector("input").focus();
  }
  function closeModal(id) {
    $(id).classList.add("hidden");
    $(id).setAttribute("aria-hidden", "true");
    if (modalOpener?.isConnected) modalOpener.focus();
  }
  for (const [name, upper] of [["login", "Login"], ["register", "Register"]]) {
    on("open" + upper + "Btn", "click", () => openModal(name + "Modal"));
    on("close" + upper + "Btn", "click", () => closeModal(name + "Modal"));
  }
  document.querySelectorAll(".modal-backdrop").forEach(el => el.addEventListener("click", () => closeModal(el.parentElement.id)));
  on("switchToLoginBtn", "click", () => { closeModal("registerModal"); openModal("loginModal"); });
  on("switchToRegisterBtn", "click", () => { closeModal("loginModal"); openModal("registerModal"); });
  document.addEventListener("keydown", e => {
    const modal = document.querySelector(".modal:not(.hidden)");
    if (!modal) return;
    if (e.key === "Escape") { closeModal(modal.id); return; }
    if (e.key !== "Tab") return;
    const controls = [...modal.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  async function submitAuth(buttonId, errorId, action, modalId) {
    requireStorage();
    $(buttonId).disabled = true;
    message(errorId);
    try {
      await action();
      $(modalId).querySelectorAll('input[type="password"]').forEach(input => { input.value = ""; });
      closeModal(modalId);
      refreshUser();
      showPage("home");
      message("appMessage");
      message("predictionMessage", "You are signed in locally. Choose a departure and save your trip.");
    } finally { $(buttonId).disabled = false; }
  }
  on("createAccountBtn", "click", () => submitAuth("createAccountBtn", "registerError", () =>
    store.register($("registerName").value, $("registerEmail").value, $("registerPassword").value, $("registerConfirm").value), "registerModal"), "registerError");
  on("loginSubmitBtn", "click", () => submitAuth("loginSubmitBtn", "loginError", () =>
    store.login($("loginEmail").value, $("loginPassword").value), "loginModal"), "loginError");
  on("continueGuestBtn", "click", () => {
    requireStorage(); store.guest(); refreshUser();
    message("predictionMessage", "Guest mode is ready. Guest trips are shared in this browser.");
  }, "predictionMessage");
  on("logoutBtn", "click", () => {
    requireStorage(); store.logout(); refreshUser(); showPage("home");
    message("predictionMessage", "You are logged out. Log in or continue as guest to save trips.");
  });

  const pages = ["home", "analytics", "saved", "security", "profile"];
  function showPage(name) {
    if (!pages.includes(name)) return;
    pages.forEach(id => $("page-" + id).classList.toggle("hidden", id !== name));
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === name);
      if (btn.dataset.page === name) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    if (name === "analytics") { updateAnalytics(); attempt(updateSavedAnalytics); }
    if (name === "saved") attempt(renderSavedTrips);
    if (name === "profile") attempt(renderProfile);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
  on("brandHome", "click", e => { e.preventDefault(); showPage("home"); });
  on("heroPredictBtn", "click", () => { showPage("home"); $("predictor").scrollIntoView({ behavior: "smooth" }); });
  on("openMapBtn", "click", () => { showPage("home"); $("mapHeading").scrollIntoView({ behavior: "smooth", block: "start" }); });
  on("profileBtn", "click", () => showPage("profile"));
  function refreshUser() {
    const user = store.getCurrentUser();
    $("guestActions").classList.toggle("hidden", !!user);
    $("userActions").classList.toggle("hidden", !user);
    $("continueGuestBtn").classList.toggle("hidden", !!user);
    $("headerUserName").textContent = user?.name.split(" ")[0] || "User";
    attempt(renderSavedTrips);
    attempt(updateSavedAnalytics);
  }
  function populateRoutes(id, all = false) {
    $(id).replaceChildren();
    if (all) $(id).append(new Option("All routes", "all"));
    Object.entries(ROUTES).forEach(([key, route]) => $(id).append(new Option(route.name, key)));
    if (id === "routeSelect") $("routeCatalogMessage").textContent =
      Object.keys(ROUTES).length + " routes available: " + Object.keys(ROUTES).join(", ") + ".";
  }
  function populateStops() {
    const route = ROUTES[$("routeSelect").value];
    $("stopSelect").replaceChildren(...route.stops.map((name, i) => new Option(name, String(i))));
    $("stopSearch").value = "";
    $("stopsTitle").textContent = route.name + " stops";
    $("stopCount").textContent = route.stops.length + " stops";
    $("routeCatalogMessage").textContent = Object.keys(ROUTES).length + " routes available: " + Object.keys(ROUTES).join(", ") + "." +
      (route.source ? " Selected route uses a historical 2024 observed stop pattern; occupancy and vehicle capacity are simulated." : "");
    routeMap?.setRoute($("routeSelect").value, 0);
    renderStops(); predict();
  }
  function renderStops() {
    const route = ROUTES[$("routeSelect").value];
    const query = $("stopSearch").value.trim().toLowerCase();
    $("stopList").replaceChildren();
    route.stops.forEach((stop, index) => {
      if (!stop.toLowerCase().includes(query)) return;
      const selected = index === Number($("stopSelect").value);
      const button = element("button", undefined, "stop-item" + (selected ? " active" : ""));
      button.type = "button";
      button.setAttribute("aria-pressed", selected);
      button.append(element("span", String(index + 1).padStart(2, "0"), "stop-index"), element("span", stop));
      button.addEventListener("click", () => { $("stopSelect").value = String(index); renderStops(); predict(); });
      $("stopList").append(button);
    });
    $("searchMessage").textContent = $("stopList").children.length ? "" : "Stop not found.";
    routeMap?.selectStop(Number($("stopSelect").value));
  }
  const dayLabel = trip => trip.dayOffset ? "Next day" : "Today";
  function renderPrediction() {
    const trip = currentPrediction;
    const level = trip && getLevel(trip.occupancy);
    for (const [id, text] of Object.entries({
      occupancyMetric: trip ? trip.occupancy + "%" : "—", passengersMetric: trip?.passengers ?? "—",
      capacityMetric: trip?.capacity ?? "—", heroPercent: trip ? trip.occupancy + "%" : "—",
      heroState: level ? level.label + " occupancy" : "Choose a valid trip", heroRoute: trip?.routeName ?? "—",
      heroStop: trip?.stop ?? "—", heroTime: trip?.time ?? "—", heroNext: trip ? dayLabel(trip) : "—",
      statusPill: level?.label ?? "Waiting", recommendationTitle: level?.title ?? "Choose a departure time.",
      recommendationText: level?.text ?? "A valid route, stop and time are needed before saving."
    })) $(id).textContent = text;
    $("statusPill").className = "status-pill " + (level?.className || "status-medium");
    $("progressFill").style.width = (trip?.occupancy || 0) + "%";
    $("progressFill").style.background = level?.color || "#2f6df6";
  }
  function selectPrediction(index) {
    currentPrediction = options[index];
    renderPrediction();
    document.querySelectorAll(".comparison-option").forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    message("predictionMessage", `Selected ${currentPrediction.time} (${dayLabel(currentPrediction)}). Save trip will save this option.`);
  }
  function renderComparison() {
    $("comparisonOptions").replaceChildren();
    if (!options.length) {
      $("comparisonSummary").textContent = "Enter a valid time to compare departures.";
      return;
    }
    const minimum = Math.min(...options.map(trip => trip.occupancy));
    const best = options.filter(trip => trip.occupancy === minimum);
    $("comparisonSummary").textContent = best.length === options.length
      ? `All options have equal predicted occupancy (${minimum}%). Choose the time that suits you.`
      : `Lowest predicted occupancy: ${minimum}% at ${best.map(trip => trip.time + " (" + dayLabel(trip) + ")").join(" and ")}. ${best.length > 1 ? "These options are tied." : "Compare the extra waiting time before choosing."}`;
    options.forEach((trip, index) => {
      const button = element("button", undefined, "comparison-option");
      button.type = "button";
      button.dataset.offset = String(trip.offset);
      button.setAttribute("aria-pressed", String(index === 0));
      button.append(element("span", `+${trip.offset} min · ${dayLabel(trip)}`, "option-label"),
        element("strong", trip.time), element("span", `${trip.occupancy}% · ${trip.passengers}/${trip.capacity} passengers`),
        element("span", getLevel(trip.occupancy).title),
        element("small", trip.occupancy === minimum ? "Lowest predicted occupancy" : "Alternative departure"));
      button.addEventListener("click", () => selectPrediction(index));
      $("comparisonOptions").append(button);
    });
  }
  function predict() {
    message("predictionMessage");
    syncTimeControls();
    try {
      options = compareTrips($("routeSelect").value, Number($("stopSelect").value), $("timeInput").value);
      currentPrediction = options[0];
      $("timeInput").removeAttribute("aria-invalid");
    } catch (error) {
      currentPrediction = null; options = [];
      $("timeInput").setAttribute("aria-invalid", "true");
      message("predictionMessage", error.message, true);
    }
    renderPrediction(); renderComparison();
  }
  on("routeSelect", "change", populateStops);
  on("stopSelect", "change", () => { renderStops(); predict(); });
  on("stopSearch", "input", renderStops);
  on("clearSearchBtn", "click", () => { $("stopSearch").value = ""; renderStops(); });
  on("predictBtn", "click", predict);
  on("timeInput", "input", predict);
  // Text edits already update on input. Rebuilding cards on the later blur
  // change event would remove the card under the user's pending click.
  function clock(minutes) {
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    return String(Math.floor(wrapped / 60)).padStart(2, "0") + ":" + String(wrapped % 60).padStart(2, "0");
  }
  function syncTimeControls() {
    const time = $("timeInput").value;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      $("timeRangeLabel").textContent = "Choose a time";
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    $("timeRange").value = hours * 60 + minutes;
    $("timeRange").setAttribute("aria-valuetext", time);
    $("timeRangeLabel").textContent = time;
    if ($("timeHour")) $("timeHour").value = String(hours).padStart(2, "0");
    if ($("timeMinute")) $("timeMinute").value = String(minutes).padStart(2, "0");
  }
  function changeTime(time) { $("timeInput").value = time; predict(); }
  function shiftTime(delta) {
    const time = $("timeInput").value;
    if (!time) throw new Error("Time is required. Choose a time first, move the slider or use Now.");
    const [hours, minutes] = time.split(":").map(Number);
    changeTime(clock(hours * 60 + minutes + delta));
  }
  on("timeEarlierBtn", "click", () => shiftTime(-15), "predictionMessage");
  on("timeLaterBtn", "click", () => shiftTime(15), "predictionMessage");
  on("timeNowBtn", "click", () => changeTime(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date())), "predictionMessage");
  on("timeRange", "input", () => changeTime(clock(Number($("timeRange").value))));
  on("timeRange", "change", () => changeTime(clock(Number($("timeRange").value))));
  const chooseClockTime = () => changeTime($("timeHour").value + ":" + $("timeMinute").value);
  on("timeHour", "change", chooseClockTime, "predictionMessage");
  on("timeMinute", "change", chooseClockTime, "predictionMessage");
  on("resetBtn", "click", () => { $("routeSelect").selectedIndex = 0; $("timeInput").value = "18:00"; populateStops(); });
  on("saveTripBtn", "click", () => {
    requireStorage();
    if (!currentPrediction || !$("timeInput").value) throw new Error("Time is required. Choose a valid trip before saving.");
    const { offset, ...trip } = currentPrediction;
    store.saveTrip(trip);
    message("predictionMessage", `Saved ${trip.routeName} at ${trip.time} (${dayLabel(trip)}). Open Saved Trips to view it.`);
    attempt(renderSavedTrips); attempt(updateSavedAnalytics);
  }, "predictionMessage");

  function renderSavedTrips() {
    $("savedTripsList").replaceChildren();
    try {
      requireStorage();
      const user = store.getCurrentUser();
      if (!user) { $("savedTripsList").append(element("div", "Please log in or continue as guest.", "empty-state")); return; }
      const filter = $("savedFilter").value;
      const trips = store.getTrips().filter(trip => filter === "all" || trip.routeId === filter);
      if (!trips.length) $("savedTripsList").append(element("div", "No saved trips yet.", "empty-state"));
      trips.forEach(trip => {
        const row = element("article", undefined, "saved-trip");
        for (const [label, value] of [["Route", trip.routeName], ["Stop", trip.stop + (trip.stopIndex !== undefined ? " · Stop " + (trip.stopIndex + 1) : "")], ["Time", trip.time + " · " + dayLabel(trip)], ["Occupancy", trip.occupancy + "%"]]) {
          const cell = element("div");
          cell.append(element("small", label), element("strong", value)); row.append(cell);
        }
        const del = element("button", "Delete", "delete-btn");
        del.setAttribute("aria-label", `Delete ${trip.routeName} at ${trip.time}, ${trip.stop}${trip.stopIndex !== undefined ? ", stop " + (trip.stopIndex + 1) : ""}`);
        del.addEventListener("click", () => attempt(() => {
          store.deleteTrip(trip.id); renderSavedTrips(); updateSavedAnalytics();
          message("appMessage", "Trip deleted. Saved trip analytics updated.");
        }));
        row.append(del); $("savedTripsList").append(row);
      });
    } catch (error) {
      $("savedTripsList").append(element("div", error.message, "empty-state error"));
      throw error;
    }
  }
  on("savedFilter", "change", renderSavedTrips);
  function barChart(id, data) {
    const chart = $(id); chart.replaceChildren();
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", data.length ? data.map(item => `${item.label}: ${item.value}%`).join("; ") : "No saved trip data");
    data.forEach(item => {
      const column = element("div", undefined, "bar-column");
      const bar = element("div", undefined, "bar");
      bar.style.height = Math.max(4, item.value * 2.2) + "px";
      column.append(element("span", item.value + "%", "bar-value"), bar, element("span", item.label, "bar-label"));
      chart.append(column);
    });
  }
  function updateSavedAnalytics() {
    $("savedCount").textContent = "0"; $("savedAverage").textContent = "—"; $("savedMaximum").textContent = "—";
    barChart("savedBarChart", []);
    try {
      requireStorage();
      const user = store.getCurrentUser();
      const trips = store.getTrips();
      $("savedAnalyticsMessage").textContent = !user ? "Log in or continue as guest to analyse saved trips." : !trips.length ? "No saved trips yet. Save a prediction to see your results." : "Updated from " + trips.length + " saved trip(s).";
      $("savedCount").textContent = trips.length;
      if (!trips.length) return;
      $("savedAverage").textContent = Math.round(trips.reduce((sum, trip) => sum + trip.occupancy, 0) / trips.length) + "%";
      $("savedMaximum").textContent = Math.max(...trips.map(trip => trip.occupancy)) + "%";
      const data = Object.keys(ROUTES).flatMap(id => {
        const group = trips.filter(trip => trip.routeId === id);
        return group.length ? [{ label: ROUTES[id].name, value: Math.round(group.reduce((sum, trip) => sum + trip.occupancy, 0) / group.length) }] : [];
      });
      barChart("savedBarChart", data);
    } catch (error) { $("savedAnalyticsMessage").textContent = error.message; throw error; }
  }
  const TIMES = ["06:00", "08:00", "10:00", "12:00", "14:00", "17:00", "18:00", "20:00", "22:00"];
  function updateAnalytics() {
    const routeId = $("analyticsRouteSelect").value;
    const index = Math.floor(ROUTES[routeId].stops.length * 0.55);
    const data = TIMES.map(time => ({ label: time, value: calculateOccupancy(routeId, index, time) }));
    const average = Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length);
    const max = Math.max(...data.map(item => item.value));
    const busiest = data.find(item => item.value === max);
    $("analyticsAverage").textContent = average + "%";
    $("analyticsMaximum").textContent = max + "%";
    $("analyticsHigh").textContent = data.filter(item => item.value >= 75).length;
    $("analyticsBusiest").textContent = busiest.label;
    $("findingOne").textContent = `1. Average simulated occupancy is ${average}%.`;
    $("findingTwo").textContent = `2. Highest simulated occupancy is ${max}% at ${busiest.label}.`;
    $("analyticsDecision").textContent = `In this simulation, operators could increase frequency around ${busiest.label}. This is not live demand data.`;
    barChart("barChart", data);
  }
  on("analyticsRouteSelect", "change", updateAnalytics);
  function renderProfile() {
    requireStorage();
    const user = store.getCurrentUser();
    if (!user) { showPage("home"); openModal("loginModal"); return; }
    for (const [id, value] of Object.entries({ profileName: user.name, profileEmail: user.email, profileType: user.type,
      profileTrips: store.getTrips().length, profileInitial: user.name[0].toUpperCase() })) $(id).textContent = value;
  }
  async function initializeStorage() {
    try {
      await store.init();
      storageReady = true;
      $("legacyRecovery").classList.add("hidden");
      message("appMessage");
      refreshUser();
    } catch (error) {
      storageReady = false;
      if (error.code === "LEGACY_PASSWORD_RESET") $("legacyRecovery").classList.remove("hidden");
      report(error);
    }
  }
  on("legacyRecoverBtn", "click", async () => {
    $("legacyRecoverBtn").disabled = true;
    message("legacyError");
    try {
      await store.recoverLegacy($("legacyEmail").value, $("legacyPassword").value, $("legacyConfirm").value);
      $("legacyEmail").value = ""; $("legacyPassword").value = ""; $("legacyConfirm").value = "";
      await initializeStorage();
      message(storageReady ? "appMessage" : "legacyError", storageReady
        ? "Legacy password updated. Your existing local account and trips were preserved. You can now log in."
        : "This account was updated. Resolve the remaining legacy account warning above to complete setup.");
    } finally { $("legacyRecoverBtn").disabled = false; }
  }, "legacyError");
  // Reflect updates made in another tab of this origin without discarding local data.
  window.addEventListener("storage", () => attempt(() => {
    refreshUser();
    if (!$("page-profile").classList.contains("hidden")) renderProfile();
  }));
  populateRoutes("routeSelect"); populateRoutes("analyticsRouteSelect"); populateRoutes("savedFilter", true);
  for (const [id, count] of [["timeHour", 24], ["timeMinute", 60]]) {
    if ($(id)) for (let value = 0; value < count; value++) {
      const text = String(value).padStart(2, "0");
      $(id).append(new Option(text, text));
    }
  }
  try {
    routeMap = window.SmartBusRouteMap?.create({
      containerId: "routeMap",
      onSelectStop(index) {
        $("stopSelect").value = String(index);
        renderStops(); predict();
      }
    }) || null;
    if (!routeMap) $("mapStatus").textContent = "Map unavailable. You can still choose a stop from the list.";
  } catch {
    $("mapStatus").textContent = "Map unavailable. You can still choose a stop from the list.";
  }
  populateStops(); updateAnalytics();
  await initializeStorage();
});
