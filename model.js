(() => {
  "use strict";
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

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
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


  function makePrediction(routeId, stopIndex, time, dayOffset = 0) {
    if (!Object.prototype.hasOwnProperty.call(ROUTES, routeId)) throw new Error("Choose a valid route.");
    const route = ROUTES[routeId];
    if (!Number.isInteger(stopIndex) || !route.stops[stopIndex]) throw new Error("Choose a valid stop.");
    if (!time || !time.trim()) throw new Error("Time is required. Choose a departure time.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Enter a valid time (00:00–23:59).");
    if (dayOffset !== 0 && dayOffset !== 1) throw new Error("Choose today or next day.");
    const occupancy = calculateOccupancy(routeId, stopIndex, time);
    return {
      id: window.SmartBusUtils.createId(), routeId, routeName: route.name, stop: route.stops[stopIndex],
      time, dayOffset, occupancy, passengers: Math.round(route.capacity * occupancy / 100),
      capacity: route.capacity
    };
  }

  function compareTrips(routeId, stopIndex, time) {
    makePrediction(routeId, stopIndex, time); // Validate before parsing, including empty input.
    const [hours, minutes] = time.split(":").map(Number);
    return [0, 30, 60].map(offset => {
      const total = hours * 60 + minutes + offset;
      const clock = String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
      return { ...makePrediction(routeId, stopIndex, clock, Math.floor(total / 1440)), offset };
    });
  }

  window.SmartBusModel = Object.freeze({ ROUTES, calculateOccupancy, getLevel, makePrediction, compareTrips });
})();
