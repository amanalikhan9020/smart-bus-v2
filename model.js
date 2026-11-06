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
    },
    "12": {
      "name": "Bus 12",
      "capacity": 100,
      "stops": [
        "Teatr Zhastar",
        "ul.Ybyrai Altynsarina",
        "Ulitsa A. Moldagulovoi",
        "Shkola-litsei No. 15",
        "ZhK Svechki",
        "Prospekt Saryarka",
        "Sportivnyi kompleks ABYROY",
        "Shkola Zerde",
        "Ulitsa Kenesary",
        "Park Astana",
        "TRTs KeruenCity",
        "TRTs Saryarka",
        "Teatr Astana Opera",
        "Ulitsa  Dinmukhameda Kunaeva",
        "Kazakhstan temir zholy",
        "monument Baiterek",
        "Dom ministerstv",
        "Dom Ministerstv",
        "Finansovyi tsentr",
        "ZhK Akzhaik",
        "K'arlyg'ash balabak'shasy",
        "Triumfal'naia arka Mangilik El",
        "ul. Bukhar zhyrau",
        "ZhK Promenad Ekspo",
        "ZhK Orynbor Towers",
        "Astana EKSPO",
        "ZhK Ekspo Siti",
        "Bol'nitsa Meditsinskogo tsentra UDP RK",
        "E 495",
        "Detskii sad Karlygash",
        "E 319",
        "Kanal Nura-Esil'",
        "Sadovodcheskoe obshchestvo Aviator",
        "ul. Zhanadariia",
        "Detskii sad Balbulak",
        "Sarytogai",
        "sredniaia shkola No. 24",
        "Ulitsa Arnasai",
        "Mechet' Al'zhan Ana"
      ],
      "source": {
        "name": "Astana historical GTFS — Mansurova et al. (2025)",
        "repository": "https://github.com/kabuli-web/bus-eta-uncertainty",
        "routesUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/routes.txt",
        "routeSequenceUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/stop_times.txt",
        "tripDirectionsUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/trips.txt",
        "stopCoordinatesUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/stops.txt",
        "paperUrl": "https://doi.org/10.3390/data10080119",
        "datasetUrl": "https://zenodo.org/records/15769359",
        "license": "CC BY 4.0",
        "licenseEvidenceUrl": "https://github.com/Riyas-m-n/BusInsight#9-dataset--attribution",
        "routeId": "c453217f-9f9d-49ce-8b32-14a6b7013691",
        "routeShortName": "12",
        "directionId": "1",
        "coverageStart": "2024-07-29",
        "coverageEnd": "2024-09-21",
        "observedTripCount": 2921,
        "matchingPatternTripCount": 890,
        "distinctObservedPatterns": 502,
        "representativeTripId": "25055",
        "representativeServiceDate": "2024-09-08",
        "selectionMethod": "For this route_short_name and direction_id=1, sort each observed trip by numeric stop_sequence and count exact ordered stop_id tuples. Select the most frequent tuple. The entire selected observed pattern is retained; no missing stop is inferred and no stop is deleted.",
        "limitations": "Historical observed trip pattern, not a verified current or official complete route. Coordinates and stop IDs are source GTFS; original Latin/transliterated stop names retained. No live transit, timetable, passenger count or bus capacity is supplied by this integration.",
        "metadataCaution": "Source route_long_name duplicates route 10 (Astana Railway Station – International Airport – Astana Railway Station). That field is not used to identify endpoints. Identity comes from route_short_name=12 and trips.route_id; endpoints come from the selected stop_times pattern."
      },
      "simulation": {
        "capacityIsAssumption": true,
        "capacityAssumptionNote": "100 passengers is a demonstration-model assumption, not measured or operator-sourced capacity. Existing occupancy predictions must be presented as simulated estimates, not live data."
      }
    },
    "46": {
      "name": "Bus 46",
      "capacity": 100,
      "stops": [
        "Mu'sa dukeni",
        "Tarbagatai",
        "Aktobe",
        "Ulytau",
        "Keleshek",
        "Zhanakonys",
        "per. Taitobe",
        "Ardagerler",
        "Titova",
        "Shugyla",
        "Kafe Sulukol'",
        "Shugyla",
        "Kladbishche",
        "Medeu",
        "K'artaly",
        "Akan Sery",
        "Sredniaia shkola No. 18",
        "Prospekt Saryarka",
        "Sportivnyi kompleks ABYROY",
        "Shkola Zerde",
        "Ulitsa Kenesary",
        "Park Astana",
        "TRTs KeruenCity",
        "TRTs Saryarka",
        "Teatr Astana Opera",
        "TRTs Khan Shatyr",
        "Respublikanskii diagnosticheskii tsentr",
        "Kardiokhirurgicheskaia klinika",
        "Mechet' Abu Nasyr al-Farabi",
        "TRTs Keruen",
        "monument Baiterek",
        "Dom ministerstv",
        "Dom Ministerstv",
        "Finansovyi tsentr",
        "ZhK Akzhaik",
        "K'arlyg'ash balabak'shasy",
        "Triumfal'naia arka Mangilik El",
        "ul. Bukhar zhyrau",
        "ZhK Promenad Ekspo",
        "ZhK Orynbor Towers",
        "Karakat"
      ],
      "source": {
        "name": "Astana historical GTFS — Mansurova et al. (2025)",
        "repository": "https://github.com/kabuli-web/bus-eta-uncertainty",
        "routesUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/routes.txt",
        "routeSequenceUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/stop_times.txt",
        "tripDirectionsUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/trips.txt",
        "stopCoordinatesUrl": "https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/stops.txt",
        "paperUrl": "https://doi.org/10.3390/data10080119",
        "datasetUrl": "https://zenodo.org/records/15769359",
        "license": "CC BY 4.0",
        "licenseEvidenceUrl": "https://github.com/Riyas-m-n/BusInsight#9-dataset--attribution",
        "routeId": "a3d30efc-b517-4ed6-b6a7-f5a87a3d5fa0",
        "routeShortName": "46",
        "directionId": "1",
        "coverageStart": "2024-07-29",
        "coverageEnd": "2024-09-21",
        "observedTripCount": 3950,
        "matchingPatternTripCount": 489,
        "distinctObservedPatterns": 1137,
        "representativeTripId": "28695",
        "representativeServiceDate": "2024-09-19",
        "selectionMethod": "For this route_short_name and direction_id=1, sort each observed trip by numeric stop_sequence and count exact ordered stop_id tuples. Select the most frequent tuple. The entire selected observed pattern is retained; no missing stop is inferred and no stop is deleted.",
        "limitations": "Historical observed trip pattern, not a verified current or official complete route. Coordinates and stop IDs are source GTFS; original Latin/transliterated stop names retained. No live transit, timetable, passenger count or bus capacity is supplied by this integration."
      },
      "simulation": {
        "capacityIsAssumption": true,
        "capacityAssumptionNote": "100 passengers is a demonstration-model assumption, not measured or operator-sourced capacity. Existing occupancy predictions must be presented as simulated estimates, not live data."
      }
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
      id: window.SmartBusUtils.createId(), routeId, routeName: route.name, stop: route.stops[stopIndex], stopIndex,
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
