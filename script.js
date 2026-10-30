document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ROUTES = {
    "10": {
      name: "Bus 10",
      capacity: 100,
      stops: [
        "Ж/д вокзал Астана 1","Биржан сал","Ильяса Есенберлина","Агротехнический университет",
        "Медицинский университет Астана","Политехнический колледж","БЦ Марден","Народный банк",
        "Амангельды Иманова","Жанибек Тархана","Микрорайон Самал","Парк Ататюрк","Амман",
        "Дом Министерств","НК Казахстан Темир Жолы","Динмухамеда Кунаева",
        "Кардиохирургическая клиника","Центр нейрохирургии","БЦ Асыл-тау",
        "Дворец единоборств им. Жаксылыка Ушкемпирова","Стадион Астана-Арена","Ледовый дворец Алау",
        "ЖК Экспо-Плаза","Назарбаев университет","Центральный госпиталь МВД РК","ЖК Будапешт",
        "Стелла Звезда Астаны","Шоссе Каркаралы","ЖК Family Park","Канал Нура-Есиль",
        "Садоводческое общество Авиатор","ул. Жандария","ж/м Пригородный","Арнасай",
        "Мечеть Альжан Ана","Международный аэропорт"
      ]
    },
    "501": {
      name: "Bus 501",
      capacity: 100,
      stops: [
        "Абайдың 150-жылдығы көшесі","Ақан сері көшесі","№18 орта мектеп","AVRUO спорт кешені",
        "Кенесары көшесі","Астана саябағы","KeruenCity СОО","Хан-Шатыр СОО",
        "Ұлттық кардиология орталығы","Ана мен бала орталығы","Square бизнес орталығы",
        "Научный Т/К","Назарбаев Университет жатақханасы","Ғарыш орталығы",
        "Family Park тұрғын үй кешені","Авиатор саяжай қоғамы","Пригородный Т/А","Халықаралық әуежай"
      ]
    },
    "40": {
      name: "Bus 40",
      capacity: 105,
      stops: [
        "Клиникалық-оңалту кешені","ЭКСПО Сити","№1 перинаталдық орталығы","№2 қалалық аурухана",
        "Тұран даңғылы","Назарбаев университеті","Министрліктер үйі","Жастар сарайы",
        "№22 мектеп-гимназиясы","Теміржол вокзалы"
      ]
    },
    "53": {
      name: "Bus 53",
      capacity: 105,
      stops: [
        "Клиникалық-оңалту кешені","ЭКСПО Сити","№1 перинаталдық орталығы","№2 қалалық аурухана",
        "Тұран даңғылы","Назарбаев университеті","Сарыарқа көшесі","Астана базары",
        "Жастар сарайы","№2 мектеп","Теміржол вокзалы"
      ]
    }
  };

  function safeParse(v, fallback) {
    try { return JSON.parse(v) ?? fallback; } catch { return fallback; }
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  const STORAGE = {
    users: "smartbus_users_v4",
    current: "smartbus_current_v4"
  };

  function getUsers() {
    return safeParse(localStorage.getItem(STORAGE.users), []);
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
  }

  function getCurrentUser() {
    return safeParse(localStorage.getItem(STORAGE.current), null);
  }

  function setCurrentUser(user) {
    if (user) localStorage.setItem(STORAGE.current, JSON.stringify(user));
    else localStorage.removeItem(STORAGE.current);
  }

  function tripsKey(user) {
    return "smartbus_trips_v4_" + user.id;
  }

  function getTrips() {
    const user = getCurrentUser();
    if (!user) return [];
    return safeParse(localStorage.getItem(tripsKey(user)), []);
  }

  function saveTrips(trips) {
    const user = getCurrentUser();
    if (!user) return;
    localStorage.setItem(tripsKey(user), JSON.stringify(trips));
  }

  function openModal(id) { $(id)?.classList.remove("hidden"); }
  function closeModal(id) { $(id)?.classList.add("hidden"); }

  $("openRegisterBtn")?.addEventListener("click", () => openModal("registerModal"));
  $("closeRegisterBtn")?.addEventListener("click", () => closeModal("registerModal"));
  $("openLoginBtn")?.addEventListener("click", () => openModal("loginModal"));
  $("closeLoginBtn")?.addEventListener("click", () => closeModal("loginModal"));

  document.querySelectorAll(".modal-backdrop").forEach((el) => {
    el.addEventListener("click", () => {
      closeModal("registerModal");
      closeModal("loginModal");
    });
  });

  $("switchToLoginBtn")?.addEventListener("click", () => {
    closeModal("registerModal");
    openModal("loginModal");
  });

  $("switchToRegisterBtn")?.addEventListener("click", () => {
    closeModal("loginModal");
    openModal("registerModal");
  });

  $("createAccountBtn")?.addEventListener("click", () => {
    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim().toLowerCase();
    const password = $("registerPassword").value;
    const confirm = $("registerConfirm").value;
    const error = $("registerError");

    error.textContent = "";

    if (!name || !email || !password || !confirm) {
      error.textContent = "Please fill in all fields.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = "Please enter a valid email.";
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

    if (users.some((u) => u.email === email)) {
      error.textContent = "This email is already registered.";
      return;
    }

    const user = {
      id: "user_" + Date.now(),
      name, email, password,
      type: "Registered user"
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser(user);
    closeModal("registerModal");
    updateAuthUI();
    showPage("home");
  });

  $("loginSubmitBtn")?.addEventListener("click", () => {
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const user = getUsers().find((u) => u.email === email && u.password === password);

    if (!user) {
      $("loginError").textContent = "Incorrect email or password.";
      return;
    }

    setCurrentUser(user);
    closeModal("loginModal");
    updateAuthUI();
    showPage("home");
  });

  $("continueGuestBtn")?.addEventListener("click", () => {
    setCurrentUser({ id:"guest", name:"Guest", email:"No email", type:"Guest" });
    updateAuthUI();
  });

  $("logoutBtn")?.addEventListener("click", () => {
    setCurrentUser(null);
    updateAuthUI();
    showPage("home");
  });

  function updateAuthUI() {
    const user = getCurrentUser();

    if (user) {
      $("guestActions")?.classList.add("hidden");
      $("userActions")?.classList.remove("hidden");
      $("continueGuestBtn")?.classList.add("hidden");
      if ($("headerUserName")) $("headerUserName").textContent = user.name.split(" ")[0] || "User";
    } else {
      $("guestActions")?.classList.remove("hidden");
      $("userActions")?.classList.add("hidden");
      $("continueGuestBtn")?.classList.remove("hidden");
    }
  }

  const pageIds = ["home","analytics","saved","profile"];

  function showPage(name) {
    pageIds.forEach((id) => {
      $("page-" + id)?.classList.toggle("hidden", id !== name);
    });

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === name);
    });

    if (name === "analytics") updateAnalytics();
    if (name === "saved") renderSavedTrips();
    if (name === "profile") renderProfile();

    window.scrollTo({ top:0, behavior:"smooth" });
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (pageIds.includes(btn.dataset.page)) showPage(btn.dataset.page);
    });
  });

  $("brandHome")?.addEventListener("click", (e) => {
    e.preventDefault();
    showPage("home");
  });

  $("profileBtn")?.addEventListener("click", () => showPage("profile"));

  $("heroPredictBtn")?.addEventListener("click", () => {
    showPage("home");
    $("predictor")?.scrollIntoView({ behavior:"smooth" });
  });

  function populateRoutes(select, includeAll=false) {
    if (!select) return;
    select.innerHTML = "";

    if (includeAll) {
      const op = document.createElement("option");
      op.value = "all";
      op.textContent = "All routes";
      select.appendChild(op);
    }

    Object.entries(ROUTES).forEach(([id, route]) => {
      const op = document.createElement("option");
      op.value = id;
      op.textContent = route.name;
      select.appendChild(op);
    });
  }

  populateRoutes($("routeSelect"));
  populateRoutes($("analyticsRouteSelect"));
  populateRoutes($("savedFilter"), true);

  function populateStops() {
    const route = ROUTES[$("routeSelect").value];
    $("stopSelect").innerHTML = "";

    route.stops.forEach((stop, index) => {
      const op = document.createElement("option");
      op.value = String(index);
      op.textContent = stop;
      $("stopSelect").appendChild(op);
    });

    $("stopSelect").value = "0";
    if ($("stopSearch")) $("stopSearch").value = "";
    if ($("stopsTitle")) $("stopsTitle").textContent = route.name + " stops";
    if ($("stopCount")) $("stopCount").textContent = route.stops.length + " stops";

    renderStops();
    predict();
  }

  function renderStops() {
    const route = ROUTES[$("routeSelect").value];
    const selected = Number($("stopSelect").value || 0);
    const query = ($("stopSearch")?.value || "").trim().toLowerCase();
    const list = $("stopList");

    if (!list) return;
    list.innerHTML = "";

    let found = 0;

    route.stops.forEach((stop, index) => {
      if (query && !stop.toLowerCase().includes(query)) return;
      found++;

      const btn = document.createElement("button");
      btn.className = "stop-item";
      if (index === selected) btn.classList.add("active");

      const num = document.createElement("span");
      num.className = "stop-index";
      num.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("span");
      name.textContent = stop;

      btn.append(num, name);

      btn.addEventListener("click", () => {
        $("stopSelect").value = String(index);
        renderStops();
        predict();
      });

      list.appendChild(btn);
    });

    if ($("searchMessage")) $("searchMessage").textContent = found ? "" : "Stop not found.";
  }

  $("routeSelect")?.addEventListener("change", populateStops);
  $("stopSelect")?.addEventListener("change", () => { renderStops(); predict(); });
  $("stopSearch")?.addEventListener("input", renderStops);
  $("clearSearchBtn")?.addEventListener("click", () => {
    $("stopSearch").value = "";
    renderStops();
  });

  function timeDemandFactor(hour) {
    if (hour < 6) return -12;
    if (hour < 7) return 5;
    if (hour < 8) return 20;
    if (hour < 9) return 30;
    if (hour < 11) return 15;
    if (hour < 14) return 10;
    if (hour < 17) return 15;
    if (hour < 18) return 25;
    if (hour < 19) return 35;
    if (hour < 20) return 28;
    if (hour < 22) return 12;
    return 0;
  }

  function stopDemandFactor(index, total) {
    const progress = total <= 1 ? 0 : index / (total - 1);
    return 18 * Math.sin(Math.PI * progress) + (((index * 7) % 13) - 6);
  }

  function calculateOccupancy(routeId, stopIndex, time) {
    const route = ROUTES[routeId];
    const [h, m] = time.split(":").map(Number);
    const hour = h + m / 60;

    const base = { "10":27, "501":30, "40":29, "53":31 }[routeId] || 27;

    return clamp(
      Math.round(base + timeDemandFactor(hour) + stopDemandFactor(stopIndex, route.stops.length)),
      10,
      96
    );
  }

  function getLevel(occupancy) {
    if (occupancy < 45) return {
      label:"Low", className:"status-low", color:"#16a34a",
      title:"Take this bus.", text:"Low occupancy is expected.", next:"8 min"
    };

    if (occupancy < 75) return {
      label:"Medium", className:"status-medium", color:"#f59e0b",
      title:"You can take this bus.", text:"The bus may be moderately crowded.", next:"8 min"
    };

    return {
      label:"High", className:"status-high", color:"#ef4444",
      title:"Wait for the next bus if possible.", text:"High passenger demand is expected.", next:"6 min"
    };
  }

  let currentPrediction = null;

  function predict() {
    const routeId = $("routeSelect").value;
    const route = ROUTES[routeId];
    const stopIndex = Number($("stopSelect").value || 0);
    const time = $("timeInput").value || "18:00";
    const stop = route.stops[stopIndex];
    if (!stop) return;

    const occupancy = calculateOccupancy(routeId, stopIndex, time);
    const passengers = Math.round(route.capacity * occupancy / 100);
    const level = getLevel(occupancy);

    currentPrediction = {
      id: Date.now(),
      routeId,
      routeName: route.name,
      stop,
      time,
      occupancy,
      passengers,
      capacity: route.capacity
    };

    if ($("occupancyMetric")) $("occupancyMetric").textContent = occupancy + "%";
    if ($("passengersMetric")) $("passengersMetric").textContent = passengers;
    if ($("capacityMetric")) $("capacityMetric").textContent = route.capacity;

    if ($("statusPill")) {
      $("statusPill").textContent = level.label;
      $("statusPill").className = "status-pill " + level.className;
    }

    if ($("progressFill")) {
      $("progressFill").style.width = occupancy + "%";
      $("progressFill").style.background = level.color;
    }

    if ($("recommendationTitle")) $("recommendationTitle").textContent = level.title;
    if ($("recommendationText")) $("recommendationText").textContent = level.text;
    if ($("heroPercent")) $("heroPercent").textContent = occupancy + "%";
    if ($("heroState")) $("heroState").textContent = level.label + " occupancy";
    if ($("heroRoute")) $("heroRoute").textContent = route.name;
    if ($("heroStop")) $("heroStop").textContent = stop;
    if ($("heroTime")) $("heroTime").textContent = time;
    if ($("heroNext")) $("heroNext").textContent = level.next;
  }

  $("predictBtn")?.addEventListener("click", predict);
  $("timeInput")?.addEventListener("input", predict);
  $("timeInput")?.addEventListener("change", predict);

  $("resetBtn")?.addEventListener("click", () => {
    $("routeSelect").selectedIndex = 0;
    $("timeInput").value = "18:00";
    populateStops();
  });

  $("saveTripBtn")?.addEventListener("click", () => {
    const user = getCurrentUser();
    if (!user || !currentPrediction) return;

    const trips = getTrips();

    const duplicate = trips.some((t) =>
      t.routeId === currentPrediction.routeId &&
      t.stop === currentPrediction.stop &&
      t.time === currentPrediction.time
    );

    if (duplicate) return;

    trips.unshift({ ...currentPrediction, id:Date.now() });
    saveTrips(trips);
  });

  function renderSavedTrips() {
    const list = $("savedTripsList");
    if (!list) return;

    const user = getCurrentUser();
    if (!user) {
      list.innerHTML = '<div class="empty-state">Please log in or continue as guest.</div>';
      return;
    }

    const filter = $("savedFilter")?.value || "all";
    const trips = getTrips().filter((t) => filter === "all" || t.routeId === filter);

    list.innerHTML = "";

    if (!trips.length) {
      list.innerHTML = '<div class="empty-state">No saved trips yet.</div>';
      return;
    }

    trips.forEach((trip) => {
      const row = document.createElement("article");
      row.className = "saved-trip";
      row.innerHTML = `
        <div><small>Route</small><strong>${trip.routeName}</strong></div>
        <div><small>Stop</small><strong>${trip.stop}</strong></div>
        <div><small>Time</small><strong>${trip.time}</strong></div>
        <div><small>Occupancy</small><strong>${trip.occupancy}%</strong></div>
      `;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        saveTrips(getTrips().filter((x) => x.id !== trip.id));
        renderSavedTrips();
      });

      row.appendChild(del);
      list.appendChild(row);
    });
  }

  $("savedFilter")?.addEventListener("change", renderSavedTrips);

  const TIMES = ["06:00","08:00","10:00","12:00","14:00","17:00","18:00","20:00","22:00"];

  function updateAnalytics() {
    if (!$("analyticsRouteSelect")) return;

    const routeId = $("analyticsRouteSelect").value;
    const route = ROUTES[routeId];
    const stopIndex = Math.floor(route.stops.length * 0.55);

    const data = TIMES.map((time) => ({
      time,
      occupancy: calculateOccupancy(routeId, stopIndex, time)
    }));

    const avg = Math.round(data.reduce((s,x) => s + x.occupancy, 0) / data.length);
    const max = Math.max(...data.map((x) => x.occupancy));
    const high = data.filter((x) => x.occupancy >= 75).length;
    const busiest = data.reduce((a,b) => b.occupancy > a.occupancy ? b : a);

    if ($("analyticsAverage")) $("analyticsAverage").textContent = avg + "%";
    if ($("analyticsMaximum")) $("analyticsMaximum").textContent = max + "%";
    if ($("analyticsHigh")) $("analyticsHigh").textContent = high;
    if ($("analyticsBusiest")) $("analyticsBusiest").textContent = busiest.time;
    if ($("findingOne")) $("findingOne").textContent = `1. Average occupancy is ${avg}%.`;
    if ($("findingTwo")) $("findingTwo").textContent = `2. Highest occupancy is ${max}% at ${busiest.time}.`;
    if ($("analyticsDecision")) $("analyticsDecision").textContent =
      `Transport operators could increase bus frequency around ${busiest.time}.`;

    const chart = $("barChart");
    if (chart) {
      chart.innerHTML = "";
      data.forEach((item) => {
        const col = document.createElement("div");
        col.className = "bar-column";

        const value = document.createElement("span");
        value.className = "bar-value";
        value.textContent = item.occupancy + "%";

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = Math.max(10, item.occupancy * 2.2) + "px";

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = item.time;

        col.append(value, bar, label);
        chart.appendChild(col);
      });
    }
  }

  $("analyticsRouteSelect")?.addEventListener("change", updateAnalytics);

  function renderProfile() {
    const user = getCurrentUser();
    if (!user) {
      showPage("home");
      openModal("loginModal");
      return;
    }

    if ($("profileName")) $("profileName").textContent = user.name;
    if ($("profileEmail")) $("profileEmail").textContent = user.email;
    if ($("profileType")) $("profileType").textContent = user.type;
    if ($("profileTrips")) $("profileTrips").textContent = getTrips().length;
    if ($("profileInitial")) $("profileInitial").textContent = (user.name[0] || "U").toUpperCase();
  }

  updateAuthUI();
  populateStops();
  updateAnalytics();
});
