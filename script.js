document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /*
    SmartBus Astana
    Educational prototype.

    IMPORTANT:
    - Occupancy data is simulated.
    - Account data is stored in localStorage only for demonstration.
    - Do not use a real password.
  */

  const ROUTES = {
    "10": {
      name: "Bus 10",
      capacity: 100,
      sourceNote: "Stops transcribed from the provided 2GIS screenshots.",
      stops: [
        "Ж/д вокзал Астана 1",
        "Биржан сал",
        "Ильяса Есенберлина",
        "Агротехнический университет",
        "Медицинский университет Астана",
        "Политехнический колледж",
        "БЦ Марден",
        "Народный банк",
        "Амангельды Иманова",
        "Жанибек Тархана",
        "Микрорайон Самал",
        "Парк Ататюрк",
        "Амман",
        "Дом Министерств",
        "НК Казахстан Темир Жолы",
        "Динмухамеда Кунаева",
        "Кардиохирургическая клиника",
        "Центр нейрохирургии",
        "БЦ Асыл-тау",
        "Дворец единоборств им. Жаксылыка Ушкемпирова",
        "Стадион Астана-Арена",
        "Ледовый дворец Алау",
        "ЖК Экспо-Плаза",
        "Назарбаев университет",
        "Центральный госпиталь МВД РК",
        "ЖК «Будапешт»",
        "Стелла Звезда Астаны",
        "Шоссе Каркаралы",
        "ЖК Family Park",
        "Канал Нура-Есиль",
        "Садоводческое общество Авиатор",
        "ул. Жандария",
        "ж/м Пригородный",
        "Арнасай",
        "Мечеть Альжан Ана",
        "Международный аэропорт"
      ]
    },

    "501": {
      name: "Bus 501",
      capacity: 100,
      sourceNote: "Visible stops transcribed from the provided CTS route screenshot.",
      stops: [
        "Абайдың 150-жылдығы көшесі",
        "Ақан сері көшесі",
        "№18 орта мектеп",
        "«AVRUO» спорт кешені",
        "Кенесары көшесі",
        "«Астана» саябағы",
        "KeruenCity СОО",
        "«Хан-Шатыр» СОО",
        "Ұлттық кардиология орталығы",
        "Ана мен бала орталығы",
        "Square бизнес орталығы",
        "«Научный» Т/К",
        "Назарбаев Университет жатақханасы",
        "Ғарыш орталығы",
        "Family Park тұрғын үй кешені",
        "«Авиатор» саяжай қоғамы",
        "«Пригородный» Т/А",
        "Халықаралық әуежай"
      ]
    }
  };
  ,
"40": {

  name: "Bus 40",

  capacity: 105,

  sourceNote: "Stops based on CTS route information.",

  stops: [

    "Назарбаев университеті",

    "Министрліктер үйі",

    "№22 мектеп-гимназиясы",

    "Жастар сарайы",

    "Теміржол вокзалы"

  ]

}


  // ---------- Helpers ----------

  const $ = (id) => document.getElementById(id);

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function clamp(number, min, max) {
    return Math.max(min, Math.min(max, number));
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  function formatRoute(routeId) {
    return ROUTES[routeId]?.name ?? `Bus ${routeId}`;
  }

  // ---------- Storage ----------

  const STORAGE_KEYS = {
    users: "smartbus_users_v2",
    currentUser: "smartbus_current_user_v2"
  };

  function getUsers() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.users), []);
  }

  function setUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  function getCurrentUser() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.currentUser), null);
  }

  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }

  function tripStorageKey(user) {
    return `smartbus_trips_v2_${user.id}`;
  }

  function getSavedTrips() {
    const user = getCurrentUser();
    if (!user) return [];
    return safeParse(localStorage.getItem(tripStorageKey(user)), []);
  }

  function setSavedTrips(trips) {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.setItem(tripStorageKey(user), JSON.stringify(trips));
  }

  // ---------- Modal controls ----------

  function openModal(modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function clearRegisterForm() {
    $("registerError").textContent = "";
  }

  function clearLoginForm() {
    $("loginError").textContent = "";
  }

  $("openRegisterBtn").addEventListener("click", () => {
    clearRegisterForm();
    openModal($("registerModal"));
    setTimeout(() => $("registerName").focus(), 50);
  });

  $("closeRegisterBtn").addEventListener("click", () => closeModal($("registerModal")));

  $("openLoginBtn").addEventListener("click", () => {
    clearLoginForm();
    openModal($("loginModal"));
    setTimeout(() => $("loginEmail").focus(), 50);
  });

  $("closeLoginBtn").addEventListener("click", () => closeModal($("loginModal")));

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      closeModal($("registerModal"));
      closeModal($("loginModal"));
    });
  });

  $("switchToLoginBtn").addEventListener("click", () => {
    closeModal($("registerModal"));
    clearLoginForm();
    openModal($("loginModal"));
  });

  $("switchToRegisterBtn").addEventListener("click", () => {
    closeModal($("loginModal"));
    clearRegisterForm();
    openModal($("registerModal"));
  });

  // ---------- Registration ----------

  $("createAccountBtn").addEventListener("click", () => {
    const name = $("registerName").value.trim();
    const email = normalizeEmail($("registerEmail").value);
    const password = $("registerPassword").value;
    const confirm = $("registerConfirm").value;
    const error = $("registerError");

    error.textContent = "";

    if (!name || !email || !password || !confirm) {
      error.textContent = "Please fill in all fields.";
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      error.textContent = "Please enter a valid email address.";
      return;
    }

    if (password.length < 6) {
      error.textContent = "Password must contain at least 6 characters.";
      return;
    }

    if (password !== confirm) {
      error.textContent = "Passwords do not match.";
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      error.textContent = "An account with this email already exists.";
      return;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      type: "Registered user"
    };

    users.push(newUser);
    setUsers(users);
    setCurrentUser(newUser);

    $("registerName").value = "";
    $("registerEmail").value = "";
    $("registerPassword").value = "";
    $("registerConfirm").value = "";

    closeModal($("registerModal"));
    updateAuthUI();
    showPage("home");
    showPredictionMessage(`Welcome, ${name}! Your account was created.`, "success");
  });

  // ---------- Login ----------

  $("loginSubmitBtn").addEventListener("click", () => {
    const email = normalizeEmail($("loginEmail").value);
    const password = $("loginPassword").value;
    const error = $("loginError");

    error.textContent = "";

    if (!email || !password) {
      error.textContent = "Enter your email and password.";
      return;
    }

    const user = getUsers().find(
      (item) => item.email === email && item.password === password
    );

    if (!user) {
      error.textContent = "Incorrect email or password.";
      return;
    }

    setCurrentUser(user);
    $("loginEmail").value = "";
    $("loginPassword").value = "";

    closeModal($("loginModal"));
    updateAuthUI();
    showPage("home");
    showPredictionMessage(`Welcome back, ${user.name}!`, "success");
  });

  // ---------- Guest / Logout ----------

  $("continueGuestBtn").addEventListener("click", () => {
    setCurrentUser({
      id: "guest",
      name: "Guest",
      email: "No email",
      type: "Guest"
    });

    updateAuthUI();
    showPredictionMessage("Guest mode activated. You can now save trips on this browser.", "success");
  });

  $("logoutBtn").addEventListener("click", () => {
    setCurrentUser(null);
    updateAuthUI();
    showPage("home");
    showPredictionMessage("You have logged out.", "success");
  });

  function updateAuthUI() {
    const user = getCurrentUser();

    if (user) {
      $("guestActions").classList.add("hidden");
      $("userActions").classList.remove("hidden");
      $("headerUserName").textContent = user.name.split(" ")[0] || "User";
      $("continueGuestBtn").classList.add("hidden");
    } else {
      $("guestActions").classList.remove("hidden");
      $("userActions").classList.add("hidden");
      $("continueGuestBtn").classList.remove("hidden");
    }
  }

  // ---------- Navigation ----------

  const pageIds = ["home", "analytics", "saved", "security", "profile"];

  function showPage(pageName) {
    pageIds.forEach((name) => {
      $(`page-${name}`).classList.toggle("hidden", name !== pageName);
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.page === pageName);
    });

    if (pageName === "analytics") updateAnalytics();
    if (pageName === "saved") renderSavedTrips();
    if (pageName === "profile") renderProfile();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  $("brandHome").addEventListener("click", (event) => {
    event.preventDefault();
    showPage("home");
  });

  $("profileBtn").addEventListener("click", () => showPage("profile"));

  $("heroPredictBtn").addEventListener("click", () => {
    showPage("home");
    $("predictor").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------- Routes / Stops ----------

  function populateRouteSelect(selectElement, includeAll = false) {
    selectElement.innerHTML = "";

    if (includeAll) {
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = "All routes";
      selectElement.appendChild(all);
    }

    Object.keys(ROUTES).forEach((routeId) => {
      const option = document.createElement("option");
      option.value = routeId;
      option.textContent = ROUTES[routeId].name;
      selectElement.appendChild(option);
    });
  }

  populateRouteSelect($("routeSelect"));
  populateRouteSelect($("analyticsRouteSelect"));
  populateRouteSelect($("savedFilter"), true);

  function populateStops() {
    const routeId = $("routeSelect").value;
    const route = ROUTES[routeId];

    $("stopSelect").innerHTML = "";

    route.stops.forEach((stopName, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = stopName;
      $("stopSelect").appendChild(option);
    });

    $("stopSelect").value = "0";
    $("stopSearch").value = "";
    $("stopsTitle").textContent = `${route.name} stops`;
    $("stopCount").textContent = `${route.stops.length} stops`;
    renderStopList();
    predict();
  }

  function renderStopList() {
    const routeId = $("routeSelect").value;
    const route = ROUTES[routeId];
    const query = $("stopSearch").value.trim().toLowerCase();
    const selectedIndex = Number($("stopSelect").value);
    const container = $("stopList");

    container.innerHTML = "";
    let matches = 0;

    route.stops.forEach((stopName, index) => {
      if (query && !stopName.toLowerCase().includes(query)) return;

      matches += 1;

      const button = document.createElement("button");
      button.className = "stop-item";
      if (index === selectedIndex) button.classList.add("active");

      const indexSpan = document.createElement("span");
      indexSpan.className = "stop-index";
      indexSpan.textContent = String(index + 1).padStart(2, "0");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = stopName;

      button.append(indexSpan, nameSpan);

      button.addEventListener("click", () => {
        $("stopSelect").value = String(index);
        renderStopList();
        predict();
      });

      container.appendChild(button);
    });

    $("searchMessage").textContent =
      matches === 0 ? "No stops found for this search." : "";
  }

  $("routeSelect").addEventListener("change", populateStops);
  $("stopSelect").addEventListener("change", () => {
    renderStopList();
    predict();
  });

  $("timeInput").addEventListener("input", predict);
$("timeInput").addEventListener("input", predict);
$("timeInput").addEventListener("change", predict);

  $("stopSearch").addEventListener("input", renderStopList);

  $("clearSearchBtn").addEventListener("click", () => {
    $("stopSearch").value = "";
    renderStopList();
    $("stopSearch").focus();
  });

  // ---------- Smart prediction ----------

  let currentPrediction = null;

function timeDemandFactor(hour) {

  if (hour < 6) return -12;

  if (hour >= 6 && hour < 7) {
    return 5;
  }

  if (hour >= 7 && hour < 8) {
    return 20;
  }

  if (hour >= 8 && hour < 9) {
    return 30;
  }

  if (hour >= 9 && hour < 11) {
    return 15;
  }

  if (hour >= 11 && hour < 14) {
    return 10;
  }

  if (hour >= 14 && hour < 17) {
    return 15;
  }

  if (hour >= 17 && hour < 18) {
    return 25;
  }

  if (hour >= 18 && hour < 19) {
    return 35;
  }

  if (hour >= 19 && hour < 20) {
    return 28;
  }

  if (hour >= 20 && hour < 22) {
    return 12;
  }

  return 0;
}

  if (hour < 6) {
    return -14 + hour * 1.2;
  }

  if (hour >= 6 && hour < 8) {
    return 4 + (hour - 6) * 12;
  }

  if (hour >= 8 && hour < 10) {
    return 28 - (hour - 8) * 9;
  }

  if (hour >= 10 && hour < 12) {
    return 10 - (hour - 10) * 2;
  }

  if (hour >= 12 && hour < 14) {
    return 8 + (hour - 12) * 4;
  }

  if (hour >= 14 && hour < 17) {
    return 16 + (hour - 14) * 2;
  }

  if (hour >= 17 && hour < 18) {
    return 24 + (hour - 17) * 10;
  }

  if (hour >= 18 && hour < 20) {
    return 34 - (hour - 18) * 7;
  }

  if (hour >= 20 && hour < 22) {
    return 20 - (hour - 20) * 8;
  }

  return 4 - (hour - 22) * 4;
}

  function stopDemandFactor(stopIndex, totalStops) {
    const progress = totalStops <= 1 ? 0 : stopIndex / (totalStops - 1);

    // Higher demand around the middle of the route, with a small deterministic variation.
    const middlePeak = 18 * Math.sin(Math.PI * progress);
    const pattern = ((stopIndex * 7) % 13) - 6;
    return middlePeak + pattern;
  }

  function calculateOccupancy(routeId, stopIndex, timeValue) {
    const route = ROUTES[routeId];
    const [hours, minutes] = timeValue.split(":").map(Number);
    const hour = hours + minutes / 60;

    const base = routeId === "501" ? 30 : 27;
    const occupancy =
      base +
      timeDemandFactor(hour) +
      stopDemandFactor(stopIndex, route.stops.length);

    return clamp(Math.round(occupancy), 12, 96);
  }

  function predictionLevel(occupancy) {
    if (occupancy < 45) {
      return {
        label: "Low",
        className: "status-low",
        color: "#16a34a",
        title: "Take this bus.",
        text: "Low occupancy is expected. There should be enough free space.",
        next: "8 min"
      };
    }

    if (occupancy < 75) {
      return {
        label: "Medium",
        className: "status-medium",
        color: "#f59e0b",
        title: "You can take this bus.",
        text: "The bus may be moderately crowded, but the trip should still be comfortable.",
        next: "8 min"
      };
    }

    return {
      label: "High",
      className: "status-high",
      color: "#ef4444",
      title: "Consider waiting for the next bus.",
      text: "High demand is expected. The next bus may have more available space.",
      next: "6 min"
    };
  }

  function predict() {
    const routeId = $("routeSelect").value;
    const route = ROUTES[routeId];
    const stopIndex = Number($("stopSelect").value || 0);
    const time = $("timeInput").value || "18:00";
    const stop = route.stops[stopIndex];

    if (!stop) return;

    const occupancy = calculateOccupancy(routeId, stopIndex, time);
    const passengers = Math.round((route.capacity * occupancy) / 100);
    const level = predictionLevel(occupancy);

    currentPrediction = {
      id: `trip_${Date.now()}`,
      routeId,
      routeName: route.name,
      stopIndex,
      stop,
      time,
      occupancy,
      passengers,
      capacity: route.capacity,
      createdAt: new Date().toISOString()
    };

    $("occupancyMetric").textContent = `${occupancy}%`;
    $("passengersMetric").textContent = String(passengers);
    $("capacityMetric").textContent = String(route.capacity);

    $("statusPill").textContent = level.label;
    $("statusPill").className = `status-pill ${level.className}`;

    $("progressFill").style.width = `${occupancy}%`;
    $("progressFill").style.background = level.color;

    $("recommendationTitle").textContent = level.title;
    $("recommendationText").textContent = level.text;

    $("heroPercent").textContent = `${occupancy}%`;
    $("heroState").textContent = `${level.label} occupancy`;
    $("heroRoute").textContent = route.name;
    $("heroStop").textContent = stop;
    $("heroTime").textContent = time;
    $("heroNext").textContent = level.next;

    $("predictionMessage").textContent = "";
  }

  $("predictBtn").addEventListener("click", predict);

  $("resetBtn").addEventListener("click", () => {
    $("routeSelect").selectedIndex = 0;
    $("timeInput").value = "18:00";
    populateStops();
    showPredictionMessage("Selection reset.", "success");
  });

  function showPredictionMessage(text, type = "") {
    const message = $("predictionMessage");
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  // ---------- Save / Read / Delete / Filter ----------

  $("saveTripBtn").addEventListener("click", () => {
    const user = getCurrentUser();

    if (!user) {
      showPredictionMessage(
        "Please register, log in or continue as guest before saving a trip.",
        "error"
      );
      openModal($("loginModal"));
      return;
    }

    if (!currentPrediction) {
      showPredictionMessage("Make a prediction first.", "error");
      return;
    }

    const trips = getSavedTrips();

    const duplicate = trips.some(
      (trip) =>
        trip.routeId === currentPrediction.routeId &&
        trip.stop === currentPrediction.stop &&
        trip.time === currentPrediction.time
    );

    if (duplicate) {
      showPredictionMessage("This route, stop and time are already saved.", "error");
      return;
    }

    trips.unshift({
      ...currentPrediction,
      id: `saved_${Date.now()}`
    });

    setSavedTrips(trips);
    showPredictionMessage("Trip saved successfully.", "success");
  });

  function renderSavedTrips() {
    const container = $("savedTripsList");
    const user = getCurrentUser();

    if (!user) {
      container.innerHTML =
        '<div class="empty-state">Register, log in or continue as guest to use Saved Trips.</div>';
      return;
    }

    const filter = $("savedFilter").value;
    const trips = getSavedTrips().filter(
      (trip) => filter === "all" || trip.routeId === filter
    );

    container.innerHTML = "";

    if (trips.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No saved trips for this filter yet.</div>';
      return;
    }

    trips.forEach((trip) => {
      const row = document.createElement("article");
      row.className = "saved-trip";

      const route = document.createElement("div");
      route.innerHTML = `<small>Route</small><strong>${trip.routeName}</strong>`;

      const stop = document.createElement("div");
      stop.innerHTML = `<small>Stop</small><strong></strong>`;
      stop.querySelector("strong").textContent = trip.stop;

      const time = document.createElement("div");
      time.innerHTML = `<small>Time</small><strong>${trip.time}</strong>`;

      const occupancy = document.createElement("div");
      occupancy.innerHTML = `<small>Occupancy</small><strong>${trip.occupancy}%</strong>`;

      const remove = document.createElement("button");
      remove.className = "delete-btn";
      remove.textContent = "Delete";

      remove.addEventListener("click", () => {
        const updated = getSavedTrips().filter((item) => item.id !== trip.id);
        setSavedTrips(updated);
        renderSavedTrips();
      });

      row.append(route, stop, time, occupancy, remove);
      container.appendChild(row);
    });
  }

  $("savedFilter").addEventListener("change", renderSavedTrips);

  // ---------- Analytics ----------

  const ANALYTICS_TIMES = ["06:00", "08:00", "10:00", "12:00", "14:00", "17:00", "18:00", "20:00", "22:00"];

  function buildAnalyticsDataset(routeId) {
    const route = ROUTES[routeId];
    const representativeStop = Math.floor(route.stops.length * 0.55);

    return ANALYTICS_TIMES.map((time) => ({
      time,
      occupancy: calculateOccupancy(routeId, representativeStop, time)
    }));
  }

  function updateAnalytics() {
    const routeId = $("analyticsRouteSelect").value;
    const data = buildAnalyticsDataset(routeId);

    const average = Math.round(
      data.reduce((sum, item) => sum + item.occupancy, 0) / data.length
    );

    const maximum = Math.max(...data.map((item) => item.occupancy));
    const highDemand = data.filter((item) => item.occupancy >= 75).length;
    const busiest = data.reduce((best, item) =>
      item.occupancy > best.occupancy ? item : best
    );

    $("analyticsAverage").textContent = `${average}%`;
    $("analyticsMaximum").textContent = `${maximum}%`;
    $("analyticsHigh").textContent = String(highDemand);
    $("analyticsBusiest").textContent = busiest.time;

    $("findingOne").textContent =
      `1. ${formatRoute(routeId)} has an average simulated occupancy of ${average}% across the analysed time periods.`;

    $("findingTwo").textContent =
      `2. The highest simulated occupancy is ${maximum}% at ${busiest.time}.`;

    $("analyticsDecision").textContent =
      highDemand > 0
        ? `The operator could increase bus frequency around ${busiest.time} because this period reaches the highest predicted demand.`
        : "Current simulated demand does not reach the high-demand threshold, so the existing frequency could be maintained.";

    renderBarChart(data);
  }

  function renderBarChart(data) {
    const chart = $("barChart");
    chart.innerHTML = "";

    data.forEach((item) => {
      const column = document.createElement("div");
      column.className = "bar-column";

      const value = document.createElement("span");
      value.className = "bar-value";
      value.textContent = `${item.occupancy}%`;

      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.max(8, item.occupancy * 2.25)}px`;

      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = item.time;

      column.append(value, bar, label);
      chart.appendChild(column);
    });
  }

  $("analyticsRouteSelect").addEventListener("change", updateAnalytics);

  // ---------- Profile ----------

  function renderProfile() {
    const user = getCurrentUser();

    if (!user) {
      showPage("home");
      openModal($("loginModal"));
      return;
    }

    $("profileName").textContent = user.name;
    $("profileEmail").textContent = user.email;
    $("profileType").textContent = user.type;
    $("profileTrips").textContent = String(getSavedTrips().length);
    $("profileInitial").textContent = (user.name?.[0] || "U").toUpperCase();
  }

  // ---------- Keyboard convenience ----------

  $("registerConfirm").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("createAccountBtn").click();
  });

  $("loginPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("loginSubmitBtn").click();
  });

  // ---------- Start ----------

  updateAuthUI();
  populateStops();
  updateAnalytics();
});
