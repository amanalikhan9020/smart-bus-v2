document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =====================================================
  // ROUTES
  // =====================================================

  const ROUTES = {
    "10": {
      name: "Bus 10",
      capacity: 100,

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
        "ЖК Будапешт",
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

      stops: [
        "Абайдың 150-жылдығы көшесі",
        "Ақан сері көшесі",
        "№18 орта мектеп",
        "AVRUO спорт кешені",
        "Кенесары көшесі",
        "Астана саябағы",
        "KeruenCity СОО",
        "Хан-Шатыр СОО",
        "Ұлттық кардиология орталығы",
        "Ана мен бала орталығы",
        "Square бизнес орталығы",
        "Научный Т/К",
        "Назарбаев Университет жатақханасы",
        "Ғарыш орталығы",
        "Family Park тұрғын үй кешені",
        "Авиатор саяжай қоғамы",
        "Пригородный Т/А",
        "Халықаралық әуежай"
      ]
    },

    "40": {
      name: "Bus 40",
      capacity: 105,

      stops: [
        "Клиникалық-оңалту кешені",
        "ЭКСПО Сити",
        "№1 перинаталдық орталығы",
        "№2 қалалық аурухана",
        "Тұран даңғылы",
        "Назарбаев университеті",
        "Министрліктер үйі",
        "Дом Министерств",
        "Жастар сарайы",
        "№22 мектеп-гимназиясы",
        "Теміржол вокзалы"
      ]
    },

    "53": {
      name: "Bus 53",
      capacity: 105,

      stops: [
        "Клиникалық-оңалту кешені",
        "ЭКСПО Сити",
        "№1 перинаталдық орталығы",
        "№2 қалалық аурухана",
        "Тұран даңғылы",
        "Назарбаев университеті",
        "Сарыарқа көшесі",
        "Астана базары",
        "Жастар сарайы",
        "№2 мектеп",
        "Теміржол вокзалы"
      ]
    }
  };


  // =====================================================
  // HELPERS
  // =====================================================

  const $ = (id) => document.getElementById(id);

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }


  // =====================================================
  // LOCAL STORAGE
  // =====================================================

  const STORAGE = {
    users: "smartbus_users",
    currentUser: "smartbus_current_user"
  };

  function getUsers() {
    return safeParse(
      localStorage.getItem(STORAGE.users),
      []
    );
  }

  function saveUsers(users) {
    localStorage.setItem(
      STORAGE.users,
      JSON.stringify(users)
    );
  }

  function getCurrentUser() {
    return safeParse(
      localStorage.getItem(STORAGE.currentUser),
      null
    );
  }

  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem(
        STORAGE.currentUser,
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem(
        STORAGE.currentUser
      );
    }
  }

  function getTripKey(user) {
    return "smartbus_trips_" + user.id;
  }

  function getSavedTrips() {
    const user = getCurrentUser();

    if (!user) {
      return [];
    }

    return safeParse(
      localStorage.getItem(
        getTripKey(user)
      ),
      []
    );
  }

  function saveTrips(trips) {
    const user = getCurrentUser();

    if (!user) {
      return;
    }

    localStorage.setItem(
      getTripKey(user),
      JSON.stringify(trips)
    );
  }


  // =====================================================
  // MODALS
  // =====================================================

  function openModal(modal) {
    modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
  }


  $("openRegisterBtn").addEventListener(
    "click",
    () => {
      $("registerError").textContent = "";
      openModal($("registerModal"));
    }
  );


  $("closeRegisterBtn").addEventListener(
    "click",
    () => {
      closeModal($("registerModal"));
    }
  );


  $("openLoginBtn").addEventListener(
    "click",
    () => {
      $("loginError").textContent = "";
      openModal($("loginModal"));
    }
  );


  $("closeLoginBtn").addEventListener(
    "click",
    () => {
      closeModal($("loginModal"));
    }
  );


  document
    .querySelectorAll(".modal-backdrop")
    .forEach((background) => {

      background.addEventListener(
        "click",
        () => {

          closeModal(
            $("registerModal")
          );

          closeModal(
            $("loginModal")
          );

        }
      );

    });


  $("switchToLoginBtn").addEventListener(
    "click",
    () => {

      closeModal(
        $("registerModal")
      );

      openModal(
        $("loginModal")
      );

    }
  );


  $("switchToRegisterBtn").addEventListener(
    "click",
    () => {

      closeModal(
        $("loginModal")
      );

      openModal(
        $("registerModal")
      );

    }
  );


  // =====================================================
  // REGISTER
  // =====================================================

  $("createAccountBtn").addEventListener(
    "click",
    () => {

      const name =
        $("registerName").value.trim();

      const email =
        normalizeEmail(
          $("registerEmail").value
        );

      const password =
        $("registerPassword").value;

      const confirm =
        $("registerConfirm").value;

      const error =
        $("registerError");


      error.textContent = "";


      if (
        !name ||
        !email ||
        !password ||
        !confirm
      ) {

        error.textContent =
          "Please fill in all fields.";

        return;
      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (!emailPattern.test(email)) {

        error.textContent =
          "Please enter a valid email.";

        return;
      }


      if (password.length < 6) {

        error.textContent =
          "Password must contain at least 6 characters.";

        return;
      }


      if (password !== confirm) {

        error.textContent =
          "Passwords do not match.";

        return;
      }


      const users =
        getUsers();


      const alreadyExists =
        users.some(
          user =>
            user.email === email
        );


      if (alreadyExists) {

        error.textContent =
          "This email is already registered.";

        return;
      }


      const newUser = {

        id:
          "user_" + Date.now(),

        name:
          name,

        email:
          email,

        password:
          password,

        type:
          "Registered user"

      };


      users.push(
        newUser
      );


      saveUsers(
        users
      );


      setCurrentUser(
        newUser
      );


      closeModal(
        $("registerModal")
      );


      updateAuthUI();


      showPage(
        "home"
      );


      showMessage(
        "Account successfully created.",
        "success"
      );

    }
  );


  // =====================================================
  // LOGIN
  // =====================================================

  $("loginSubmitBtn").addEventListener(
    "click",
    () => {

      const email =
        normalizeEmail(
          $("loginEmail").value
        );

      const password =
        $("loginPassword").value;

      const error =
        $("loginError");


      error.textContent = "";


      if (!email || !password) {

        error.textContent =
          "Enter email and password.";

        return;
      }


      const user =
        getUsers().find(
          item =>
            item.email === email &&
            item.password === password
        );


      if (!user) {

        error.textContent =
          "Incorrect email or password.";

        return;
      }


      setCurrentUser(
        user
      );


      closeModal(
        $("loginModal")
      );


      updateAuthUI();


      showPage(
        "home"
      );


      showMessage(
        "Login successful.",
        "success"
      );

    }
  );


  // =====================================================
  // GUEST
  // =====================================================

  $("continueGuestBtn").addEventListener(
    "click",
    () => {

      const guest = {

        id:
          "guest",

        name:
          "Guest",

        email:
          "No email",

        type:
          "Guest"

      };


      setCurrentUser(
        guest
      );


      updateAuthUI();


      showMessage(
        "Guest mode activated.",
        "success"
      );

    }
  );


  // =====================================================
  // LOGOUT
  // =====================================================

  $("logoutBtn").addEventListener(
    "click",
    () => {

      setCurrentUser(
        null
      );


      updateAuthUI();


      showPage(
        "home"
      );

    }
  );


  function updateAuthUI() {

    const user =
      getCurrentUser();


    if (user) {

      $("guestActions")
        .classList
        .add("hidden");


      $("userActions")
        .classList
        .remove("hidden");


      $("continueGuestBtn")
        .classList
        .add("hidden");


      $("headerUserName")
        .textContent =
        user.name.split(" ")[0];

    }

    else {

      $("guestActions")
        .classList
        .remove("hidden");


      $("userActions")
        .classList
        .add("hidden");


      $("continueGuestBtn")
        .classList
        .remove("hidden");

    }

  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  const pageIds = [
    "home",
    "analytics",
    "saved",
    "profile"
  ];


  function showPage(pageName) {

    pageIds.forEach(
      name => {

        const page =
          $("page-" + name);


        if (!page) {
          return;
        }


        page.classList.toggle(
          "hidden",
          name !== pageName
        );

      }
    );


    document
      .querySelectorAll(".nav-btn")
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.page === pageName
          );

        }
      );


    if (
      pageName === "analytics"
    ) {

      updateAnalytics();

    }


    if (
      pageName === "saved"
    ) {

      renderSavedTrips();

    }


    if (
      pageName === "profile"
    ) {

      renderProfile();

    }


    window.scrollTo(
      {
        top: 0,
        behavior: "smooth"
      }
    );

  }


  document
    .querySelectorAll(".nav-btn")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            showPage(
              button.dataset.page
            );

          }
        );

      }
    );


  $("brandHome").addEventListener(
    "click",
    event => {

      event.preventDefault();

      showPage(
        "home"
      );

    }
  );


  $("profileBtn").addEventListener(
    "click",
    () => {

      showPage(
        "profile"
      );

    }
  );


  $("heroPredictBtn").addEventListener(
    "click",
    () => {

      showPage(
        "home"
      );


      $("predictor")
        .scrollIntoView(
          {
            behavior: "smooth"
          }
        );

    }
  );


  // =====================================================
  // ROUTE SELECT
  // =====================================================

  function populateRoutes(
    select,
    includeAll = false
  ) {

    select.innerHTML = "";


    if (includeAll) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        "all";


      option.textContent =
        "All routes";


      select.appendChild(
        option
      );

    }


    Object.keys(
      ROUTES
    ).forEach(
      routeId => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          routeId;


        option.textContent =
          ROUTES[routeId].name;


        select.appendChild(
          option
        );

      }
    );

  }


  populateRoutes(
    $("routeSelect")
  );


  populateRoutes(
    $("analyticsRouteSelect")
  );


  populateRoutes(
    $("savedFilter"),
    true
  );


  // =====================================================
  // STOPS
  // =====================================================

  function populateStops() {

    const routeId =
      $("routeSelect").value;


    const route =
      ROUTES[routeId];


    $("stopSelect")
      .innerHTML =
      "";


    route.stops.forEach(
      (stop, index) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          index;


        option.textContent =
          stop;


        $("stopSelect")
          .appendChild(
            option
          );

      }
    );


    $("stopSelect").value =
      "0";


    $("stopSearch").value =
      "";


    $("stopsTitle")
      .textContent =
      route.name + " stops";


    $("stopCount")
      .textContent =
      route.stops.length +
      " stops";


    renderStops();


    predict();

  }


  function renderStops() {

    const routeId =
      $("routeSelect").value;


    const route =
      ROUTES[routeId];


    const selected =
      Number(
        $("stopSelect").value
      );


    const search =
      $("stopSearch")
        .value
        .trim()
        .toLowerCase();


    const container =
      $("stopList");


    container.innerHTML =
      "";


    let found =
      0;


    route.stops.forEach(
      (stop, index) => {

        if (
          search &&
          !stop
            .toLowerCase()
            .includes(search)
        ) {

          return;
        }


        found++;


        const button =
          document.createElement(
            "button"
          );


        button.className =
          "stop-item";


        if (
          index === selected
        ) {

          button.classList.add(
            "active"
          );

        }


        const number =
          document.createElement(
            "span"
          );


        number.className =
          "stop-index";


        number.textContent =
          String(
            index + 1
          ).padStart(
            2,
            "0"
          );


        const name =
          document.createElement(
            "span"
          );


        name.textContent =
          stop;


        button.append(
          number,
          name
        );


        button.addEventListener(
          "click",
          () => {

            $("stopSelect").value =
              index;


            renderStops();


            predict();

          }
        );


        container.appendChild(
          button
        );

      }
    );


    $("searchMessage")
      .textContent =
      found === 0
        ? "Stop not found."
        : "";

  }


  $("routeSelect")
    .addEventListener(
      "change",
      populateStops
    );


  $("stopSelect")
    .addEventListener(
      "change",
      () => {

        renderStops();

        predict();

      }
    );


  $("stopSearch")
    .addEventListener(
      "input",
      renderStops
    );


  $("clearSearchBtn")
    .addEventListener(
      "click",
      () => {

        $("stopSearch").value =
          "";


        renderStops();

      }
    );


  // =====================================================
  // TIME
  // =====================================================

  function timeDemandFactor(hour) {

    if (hour < 6) {
      return -12;
    }


    if (
      hour >= 6 &&
      hour < 7
    ) {

      return 5;
    }


    if (
      hour >= 7 &&
      hour < 8
    ) {

      return 20;
    }


    if (
      hour >= 8 &&
      hour < 9
    ) {

      return 30;
    }


    if (
      hour >= 9 &&
      hour < 11
    ) {

      return 15;
    }


    if (
      hour >= 11 &&
      hour < 14
    ) {

      return 10;
    }


    if (
      hour >= 14 &&
      hour < 17
    ) {

      return 15;
    }


    if (
      hour >= 17 &&
      hour < 18
    ) {

      return 25;
    }


    if (
      hour >= 18 &&
      hour < 19
    ) {

      return 35;
    }


    if (
      hour >= 19 &&
      hour < 20
    ) {

      return 28;
    }


    if (
      hour >= 20 &&
      hour < 22
    ) {

      return 12;
    }


    return 0;

  }


  function stopDemandFactor(
    stopIndex,
    totalStops
  ) {

    const progress =
      totalStops <= 1
        ? 0
        : stopIndex /
          (totalStops - 1);


    const middlePeak =
      18 *
      Math.sin(
        Math.PI *
        progress
      );


    const variation =
      ((stopIndex * 7) % 13) -
      6;


    return (
      middlePeak +
      variation
    );

  }


  function calculateOccupancy(
    routeId,
    stopIndex,
    time
  ) {

    const route =
      ROUTES[routeId];


    const parts =
      time
        .split(":")
        .map(Number);


    const hour =
      parts[0] +
      parts[1] / 60;


    let base =
      27;


    if (
      routeId === "501"
    ) {

      base =
        30;

    }


    if (
      routeId === "40"
    ) {

      base =
        29;

    }


    if (
      routeId === "53"
    ) {

      base =
        31;

    }


    const occupancy =
      base +
      timeDemandFactor(hour) +
      stopDemandFactor(
        stopIndex,
        route.stops.length
      );


    return clamp(
      Math.round(
        occupancy
      ),
      10,
      96
    );

  }


  // =====================================================
  // PREDICTION
  // =====================================================

  let currentPrediction =
    null;


  function getLevel(
    occupancy
  ) {

    if (
      occupancy < 45
    ) {

      return {

        label:
          "Low",

        className:
          "status-low",

        color:
          "#16a34a",

        title:
          "Take this bus.",

        description:
          "Low occupancy is expected. There should be enough free space.",

        next:
          "8 min"

      };

    }


    if (
      occupancy < 75
    ) {

      return {

        label:
          "Medium",

        className:
          "status-medium",

        color:
          "#f59e0b",

        title:
          "You can take this bus.",

        description:
          "The bus may be moderately crowded.",

        next:
          "8 min"

      };

    }


    return {

      label:
        "High",

      className:
        "status-high",

      color:
        "#ef4444",

      title:
        "Wait for the next bus if possible.",

      description:
        "High passenger demand is expected.",

      next:
        "6 min"

    };

  }


  function predict() {

    const routeId =
      $("routeSelect").value;


    const route =
      ROUTES[routeId];


    const stopIndex =
      Number(
        $("stopSelect").value ||
        0
      );


    const time =
      $("timeInput").value ||
      "18:00";


    const stop =
      route.stops[
        stopIndex
      ];


    if (!stop) {
      return;
    }


    const occupancy =
      calculateOccupancy(
        routeId,
        stopIndex,
        time
      );


    const passengers =
      Math.round(
        route.capacity *
        occupancy /
        100
      );


    const level =
      getLevel(
        occupancy
      );


    currentPrediction = {

      id:
        Date.now(),

      routeId:
        routeId,

      routeName:
        route.name,

      stop:
        stop,

      time:
        time,

      occupancy:
        occupancy,

      passengers:
        passengers,

      capacity:
        route.capacity

    };


    $("occupancyMetric")
      .textContent =
      occupancy + "%";


    $("passengersMetric")
      .textContent =
      passengers;


    $("capacityMetric")
      .textContent =
      route.capacity;


    $("statusPill")
      .textContent =
      level.label;


    $("statusPill")
      .className =
      "status-pill " +
      level.className;


    $("progressFill")
      .style
      .width =
      occupancy + "%";


    $("progressFill")
      .style
      .background =
      level.color;


    $("recommendationTitle")
      .textContent =
      level.title;


    $("recommendationText")
      .textContent =
      level.description;


    $("heroPercent")
      .textContent =
      occupancy + "%";


    $("heroState")
      .textContent =
      level.label +
      " occupancy";


    $("heroRoute")
      .textContent =
      route.name;


    $("heroStop")
      .textContent =
      stop;


    $("heroTime")
      .textContent =
      time;


    $("heroNext")
      .textContent =
      level.next;


    $("predictionMessage")
      .textContent =
      "";

  }


  $("predictBtn")
    .addEventListener(
      "click",
      predict
    );


  // Очень важно:
  // время пересчитывается сразу

  $("timeInput")
    .addEventListener(
      "input",
      predict
    );


  $("timeInput")
    .addEventListener(
      "change",
      predict
    );


  $("resetBtn")
    .addEventListener(
      "click",
      () => {

        $("routeSelect")
          .selectedIndex =
          0;


        $("timeInput")
          .value =
          "18:00";


        populateStops();

      }
    );


  function showMessage(
    text,
    type = ""
  ) {

    $("predictionMessage")
      .textContent =
      text;


    $("predictionMessage")
      .className =
      "form-message " +
      type;

  }


  // =====================================================
  // SAVE TRIP
  // =====================================================

  $("saveTripBtn")
    .addEventListener(
      "click",
      () => {

        const user =
          getCurrentUser();


        if (!user) {

          showMessage(
            "Please log in, register or continue as guest.",
            "error"
          );

          return;
        }


        if (!currentPrediction) {

          showMessage(
            "Make a prediction first.",
            "error"
          );

          return;
        }


        const trips =
          getSavedTrips();


        const duplicate =
          trips.some(
            trip =>
              trip.routeId ===
                currentPrediction.routeId &&
              trip.stop ===
                currentPrediction.stop &&
              trip.time ===
                currentPrediction.time
          );


        if (duplicate) {

          showMessage(
            "This trip is already saved.",
            "error"
          );

          return;
        }


        trips.unshift({
          ...currentPrediction,
          id:
            Date.now()
        });


        saveTrips(
          trips
        );


        showMessage(
          "Trip saved successfully.",
          "success"
        );

      }
    );


  // =====================================================
  // SAVED TRIPS
  // =====================================================

  function renderSavedTrips() {

    const container =
      $("savedTripsList");


    const user =
      getCurrentUser();


    if (!user) {

      container.innerHTML =
        `
        <div class="empty-state">
          Please log in or continue as guest.
        </div>
        `;

      return;
    }


    const filter =
      $("savedFilter").value;


    let trips =
      getSavedTrips();


    if (
      filter !== "all"
    ) {

      trips =
        trips.filter(
          trip =>
            trip.routeId === filter
        );

    }


    container.innerHTML =
      "";


    if (
      trips.length === 0
    ) {

      container.innerHTML =
        `
        <div class="empty-state">
          No saved trips yet.
        </div>
        `;

      return;
    }


    trips.forEach(
      trip => {

        const row =
          document.createElement(
            "article"
          );


        row.className =
          "saved-trip";


        row.innerHTML =
          `
          <div>
            <small>Route</small>
            <strong>${trip.routeName}</strong>
          </div>

          <div>
            <small>Stop</small>
            <strong>${trip.stop}</strong>
          </div>

          <div>
            <small>Time</small>
            <strong>${trip.time}</strong>
          </div>

          <div>
            <small>Occupancy</small>
            <strong>${trip.occupancy}%</strong>
          </div>
          `;


        const deleteButton =
          document.createElement(
            "button"
          );


        deleteButton.className =
          "delete-btn";


        deleteButton.textContent =
          "Delete";


        deleteButton.addEventListener(
          "click",
          () => {

            const updated =
              getSavedTrips()
                .filter(
                  item =>
                    item.id !== trip.id
                );


            saveTrips(
              updated
            );


            renderSavedTrips();

          }
        );


        row.appendChild(
          deleteButton
        );


        container.appendChild(
          row
        );

      }
    );

  }


  $("savedFilter")
    .addEventListener(
      "change",
      renderSavedTrips
    );


  // =====================================================
  // ANALYTICS
  // =====================================================

  const ANALYTICS_TIMES = [
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "17:00",
    "18:00",
    "20:00",
    "22:00"
  ];


  function buildAnalytics(
    routeId
  ) {

    const route =
      ROUTES[routeId];


    const stopIndex =
      Math.floor(
        route.stops.length *
        0.55
      );


    return ANALYTICS_TIMES.map(
      time => ({

        time:
          time,

        occupancy:
          calculateOccupancy(
            routeId,
            stopIndex,
            time
          )

      })
    );

  }


  function updateAnalytics() {

    const routeId =
      $("analyticsRouteSelect").value;


    const data =
      buildAnalytics(
        routeId
      );


    const average =
      Math.round(

        data.reduce(
          (sum, item) =>
            sum +
            item.occupancy,
          0
        ) /

        data.length

      );


    const maximum =
      Math.max(
        ...data.map(
          item =>
            item.occupancy
        )
      );


    const highDemand =
      data.filter(
        item =>
          item.occupancy >= 75
      ).length;


    const busiest =
      data.reduce(
        (best, item) =>
          item.occupancy >
          best.occupancy
            ? item
            : best
      );


    $("analyticsAverage")
      .textContent =
      average + "%";


    $("analyticsMaximum")
      .textContent =
      maximum + "%";


    $("analyticsHigh")
      .textContent =
      highDemand;


    $("analyticsBusiest")
      .textContent =
      busiest.time;


    $("findingOne")
      .textContent =
      `1. Average occupancy is ${average}%.`;


    $("findingTwo")
      .textContent =
      `2. Highest occupancy is ${maximum}% at ${busiest.time}.`;


    $("analyticsDecision")
      .textContent =
      `Transport operators could increase bus frequency around ${busiest.time}.`;


    drawChart(
      data
    );

  }


  function drawChart(
    data
  ) {

    const chart =
      $("barChart");


    chart.innerHTML =
      "";


    data.forEach(
      item => {

        const column =
          document.createElement(
            "div"
          );


        column.className =
          "bar-column";


        const value =
          document.createElement(
            "span"
          );


        value.className =
          "bar-value";


        value.textContent =
          item.occupancy +
          "%";


        const bar =
          document.createElement(
            "div"
          );


        bar.className =
          "bar";


        bar.style.height =
          Math.max(
            10,
            item.occupancy *
            2.2
          ) +
          "px";


        const label =
          document.createElement(
            "span"
          );


        label.className =
          "bar-label";


        label.textContent =
          item.time;


        column.append(
          value,
          bar,
          label
        );


        chart.appendChild(
          column
        );

      }
    );

  }


  $("analyticsRouteSelect")
    .addEventListener(
      "change",
      updateAnalytics
    );


  // =====================================================
  // PROFILE
  // =====================================================

  function renderProfile() {

    const user =
      getCurrentUser();


    if (!user) {

      showPage(
        "home"
      );


      openModal(
        $("loginModal")
      );


      return;
    }


    $("profileName")
      .textContent =
      user.name;


    $("profileEmail")
      .textContent =
      user.email;


    $("profileType")
      .textContent =
      user.type;


    $("profileTrips")
      .textContent =
      getSavedTrips().length;


    $("profileInitial")
      .textContent =
      user.name
        .charAt(0)
        .toUpperCase();

  }


  // =====================================================
  // START WEBSITE
  // =====================================================

  updateAuthUI();

  populateStops();

  updateAnalytics();

});
