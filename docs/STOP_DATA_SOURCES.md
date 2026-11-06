# Astana stop source audit

Downloaded 201 source GTFS stops from https://raw.githubusercontent.com/kabuli-web/bus-eta-uncertainty/master/data/gtfs_data/stops.txt

Original dataset: https://zenodo.org/records/15769359
Paper: https://doi.org/10.3390/data10080119

The mirror README explicitly attributes the dataset as CC BY 4.0. Its stops.txt is byte-identical to kabuli-web mirror. Primary Zenodo host is blocked by environment network policy.

Historic GTFS; telemetry 2024-07-29–2024-09-21; routes 10, 12, 46. Not live transit or occupancy data.

No coordinate was interpolated, inferred from a landmark or generated. Original stop_id retained.

## Selected app aliases


### App route 10

| Index | App stop | Source GTFS name | Source stop ID | Direction1 observations |
|---|---|---|---|---|
| 0 | Ж/д вокзал Астана 1 | Zh/d vokzal Astana 1 | 24da8f75-2dc4-4a5d-becc-2898122eaae5 | 1 |
| 1 | Биржан сал | Ulitsa Birzhan sal | 09b35dc0-2e95-4c03-b488-5eda1557f68b | 3317 |
| 2 | Ильяса Есенберлина | Ulitsa Il'iasa Esenberlina | d81e04ca-9213-4363-b2d1-34580954fc9e | 3333 |
| 3 | Агротехнический университет | Agrotekhnicheskii universitet | f61c6540-7d01-4563-a8a6-ef667d64ea20 | 3335 |
| 4 | Медицинский университет Астана | Meditsinskii universitet Astana | 4fddb84f-fb97-43b8-a619-e667607dc9de | 3334 |
| 5 | Политехнический колледж | Politekhnicheskii kolledzh | 5ea2fd87-18be-448c-ba4a-011ed7449f1e | 3335 |
| 6 | БЦ Марден | Biznes tsentr Marden | 90bbca78-c461-4348-9ec8-4911c68a3ae3 | 3334 |
| 7 | Народный банк | Narodnyi bank | 639393f6-22fb-4ab6-a13d-98f9131736b2 | 3335 |
| 8 | Амангельды Иманова | Ulitsa Amangel'dy Imanova | e0edfbd5-454b-49aa-bd3f-9f55d679c2a4 | 3335 |
| 9 | Жанибек Тархана | Zhanibek Tarkhana | 3abac3ba-87c0-480c-aa39-fc3ec081e9c6 | 3332 |
| 10 | Микрорайон Самал | Mikroraion Samal | 4aed197d-2627-48aa-9191-4b45ed52ddbb | 3332 |
| 11 | Парк Ататюрк | Park Atatiurk | f86c97bc-80c0-4a7e-bbc0-4dbff06148ab | 3331 |
| 12 | Амман | Ulitsa Amman | 7e094e15-7fe2-424d-be5d-c650a7eaac09 | 3331 |
| 13 | Дом Министерств | Dom ministerstv | 0c611096-98ec-4284-85e1-68523f4436d3 | 3332 |
| 14 | НК Казахстан Темир Жолы | Kazakhstan temir zholy | 6de59510-6e48-4efa-8459-b2c0d2766247 | 3253 |
| 15 | Динмухамеда Кунаева | Ulitsa  Dinmukhameda Kunaeva | 160e90a6-0ebf-42f5-801d-bc26323a7705 | 3200 |
| 16 | Кардиохирургическая клиника | Kardiokhirurgicheskaia klinika | cac60a34-335b-43a0-aeb1-8d57a154facc | 3334 |
| 17 | Центр нейрохирургии | Tsentr neirokhirurgii | bf58aae9-f17c-4eb5-b280-bd59ef34e7d4 | 3330 |
| 18 | БЦ Асыл-тау | Biznes tsentr Asyl-Tau | edca5c3c-a4bf-4aad-b25a-fa60e056cb86 | 3335 |
| 19 | Дворец единоборств им. Жаксылыка Ушкемпирова | Dvorets edinoborstv im. Zhaksylyka Ushkempirova | c885bb33-9730-4071-9429-8ad8e56f4a7e | 3325 |
| 20 | Стадион Астана-Арена | Stadion Astana-Arena | 25160f65-5b76-42df-8126-ba7e0dca32d0 | 3335 |
| 21 | Ледовый дворец Алау | Ledovyi dvorets Alau | 8d5505db-a9f3-4d54-9b9e-bfd7f6e60265 | 3335 |
| 22 | ЖК Экспо-Плаза | ZhK Ekspo-Plaza | ad8964a3-38aa-4ec7-be27-55d4fa8437de | 3335 |
| 23 | Назарбаев университет | Nazarbaev universitet | 12cabd75-d75d-4b82-8364-770c7812d47f | 3335 |
| 25 | ЖК Будапешт | ZhK Budapesht | 97fe4589-8e42-4006-b28b-a0fdb7f06199 | 3033 |
| 26 | Стелла Звезда Астаны | Stela Zvezda Astany | 06eee664-f6eb-43f7-ac6a-de0d6e693a27 | 3054 |
| 27 | Шоссе Каркаралы | Karkaralinskoe shosse | 04fd1fc3-b800-465a-be89-5367e0313d21 | 3046 |
| 28 | ЖК Family Park | ZhK Family Park | ccf9d9ab-2a88-4d8f-aa7d-4d3b7eaf7a50 | 3048 |
| 29 | Канал Нура-Есиль | Kanal Nura-Esil' | 3e758949-78d7-4c07-b00b-e81d572481ee | 3053 |
| 30 | Садоводческое общество Авиатор | Sadovodcheskoe obshchestvo Aviator | bc1ee4e3-ab3a-4b4f-81cd-46eba42d01df | 2187 |
| 31 | ул. Жандария | ul. Zhanadariia | b27e4484-f45f-490f-b75f-d3c0c5f01eba | 3334 |
| 32 | ж/м Пригородный | zh/m Prigorodnyi | 13a79ef8-965a-440a-be79-13f1aa3b7e6f | 3303 |
| 33 | Арнасай | Ulitsa Arnasai | 28407e90-671f-482f-95f4-c692dd4d1e90 | 3333 |
| 34 | Мечеть Альжан Ана | Mechet' Al'zhan Ana | b42cb534-1201-4a4d-9b60-3774280e24fa | 3329 |
| 35 | Международный аэропорт | Mezhdunarodnyi aeroport | 5dafe705-9a04-4727-a75e-7ed2195cfe2a | 80 |

Unmatched: 24 Центральный госпиталь МВД РК


### App route 501

| Index | App stop | Source GTFS name | Source stop ID | Direction1 observations |
|---|---|---|---|---|
| 7 | Хан-Шатыр СОО | TRTs Khan Shatyr | a10b4fa3-0b47-4297-b29b-4d16b670ca00 | 1 |
| 14 | Family Park тұрғын үй кешені | ZhK Family Park | ccf9d9ab-2a88-4d8f-aa7d-4d3b7eaf7a50 | 3048 |
| 15 | Авиатор саяжай қоғамы | Sadovodcheskoe obshchestvo Aviator | bc1ee4e3-ab3a-4b4f-81cd-46eba42d01df | 2187 |
| 16 | Пригородный Т/А | zh/m Prigorodnyi | 13a79ef8-965a-440a-be79-13f1aa3b7e6f | 3303 |
| 17 | Халықаралық әуежай | Mezhdunarodnyi aeroport | 5dafe705-9a04-4727-a75e-7ed2195cfe2a | 80 |

Unmatched: 0 Абайдың 150-жылдығы көшесі, 1 Ақан сері көшесі, 2 №18 орта мектеп, 3 AVRUO спорт кешені, 4 Кенесары көшесі, 5 Астана саябағы, 6 KeruenCity СОО, 8 Ұлттық кардиология орталығы, 9 Ана мен бала орталығы, 10 Square бизнес орталығы, 11 Научный Т/К, 12 Назарбаев Университет жатақханасы, 13 Ғарыш орталығы


### App route 40

| Index | App stop | Source GTFS name | Source stop ID | Direction1 observations |
|---|---|---|---|---|
| 1 | ЭКСПО Сити | ZhK Ekspo Siti | cb455c22-433c-415c-9dc6-4b38f567d97a | 290 |
| 5 | Назарбаев университеті | Nazarbaev universitet | 12cabd75-d75d-4b82-8364-770c7812d47f | 3335 |
| 6 | Министрліктер үйі | Dom ministerstv | 0c611096-98ec-4284-85e1-68523f4436d3 | 3332 |

Unmatched: 0 Клиникалық-оңалту кешені, 2 №1 перинаталдық орталығы, 3 №2 қалалық аурухана, 4 Тұран даңғылы, 7 Жастар сарайы, 8 №22 мектеп-гимназиясы, 9 Теміржол вокзалы


### App route 53

| Index | App stop | Source GTFS name | Source stop ID | Direction1 observations |
|---|---|---|---|---|
| 1 | ЭКСПО Сити | ZhK Ekspo Siti | cb455c22-433c-415c-9dc6-4b38f567d97a | 290 |
| 5 | Назарбаев университеті | Nazarbaev universitet | 12cabd75-d75d-4b82-8364-770c7812d47f | 3335 |

Unmatched: 0 Клиникалық-оңалту кешені, 2 №1 перинаталдық орталығы, 3 №2 қалалық аурухана, 4 Тұран даңғылы, 6 Сарыарқа көшесі, 7 Астана базары, 8 Жастар сарайы, 9 №2 мектеп, 10 Теміржол вокзалы

## Remaining source ambiguity

For route 10 stop 24, application says Центральный госпиталь МВД РК, while source says Tsentral'nyi gospital'. These align in sequence between Nazarbaev universitet and ZhK Budapesht but the МВД РК suffix is unsupported. Keep unmatched unless renaming to base source name.
Two same-name cardiac surgery clinic stops occur consecutively in source route10 direction1. Index16 maps to cac60a34-335b-43a0-aeb1-8d57a154facc (most observed, earlier in source route sequence); other is 870084cf-ed0b-4bbd-bea0-368b5bce2425.
Non10 source-name matches do not verify membership in routes501/40/53. Side of road is taken from verified route10 direction1 solely to locate an actual named stop.

## Files

- astana-stops.json: app-ready source stops/metadata/matches.
- matched-stop-candidates.json: all source candidates, including excluded duplicates.
- bus-eta-uncertainty/data/gtfs_data: downloaded original data used for verification.


## Additional route patterns: 12 and 46

# Added historic route patterns 12 and 46

Source: [kabuli-web/bus-eta-uncertainty](https://github.com/kabuli-web/bus-eta-uncertainty), GTFS files in `data/gtfs_data`. Research: [Mansurova et al. (2025)](https://doi.org/10.3390/data10080119). Data coverage: 2024-07-29–2024-09-21. These are historical observed trip patterns, not verified current service. License CC BY 4.0 is reported by [BusInsight attribution](https://github.com/Riyas-m-n/BusInsight#9-dataset--attribution); existing stop-source audit contains the primary-host-access limitation.

| Route | GTFS route_id | Direction | Stops | Exact-pattern support | All observed trips in direction | Endpoints |
|---|---|---|---|---|---|---|
| 12 | c453217f-9f9d-49ce-8b32-14a6b7013691 | 1 | 39 | 890 | 2921 | Teatr Zhastar → Mechet' Al'zhan Ana |
| 46 | a3d30efc-b517-4ed6-b6a7-f5a87a3d5fa0 | 1 | 41 | 489 | 3950 | Mu'sa dukeni → Karakat |

Each trip was sorted by numeric `stop_sequence`; exact tuples of stop IDs were counted. The most frequent complete observed tuple for direction 1 was selected. No official full-route completeness is claimed. All 80 selected entries match the checked-in 201-stop table by exact ID. Different IDs with the same names are retained. Route 46 includes two different `Shugyla` stop IDs; both patterns include `Dom ministerstv` and `Dom Ministerstv` with different IDs. Coordinates are never invented.

Route 12 source `route_long_name` is suspicious: it repeats route 10. Its number is verified by `route_short_name=12` and matching `trips.route_id`. We do not use the long name or claim the observed endpoints are its current termini.

Capacity 100 is a labelled demonstration assumption in the artifact. Occupancy/time behavior is simulated; none is represented as measured capacity, live bus tracking or real passenger observations.

`routes-12-46.json` includes route entries, zero-based index-to-source-ID matches, source metadata, representative trip IDs, all matching trip IDs for reproducibility and SHA-256 hashes of input files. `analysis.json` contains direction distributions and top pattern support.
