"""Route expansion checks against the historical GTFS and working browser flows.

Only third-party street tiles are replaced. Stop-order digests below were derived
independently from source stop_times.txt trips 25055 and 28695, sorted by numeric
stop_sequence; the application does not supply those expected digests.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import unittest

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("SMARTBUS_TEST_URL", "http://127.0.0.1:8765")
GUEST_TRIPS = "smartbus_trips_v4_guest"
ROUTE_IDS = ["10", "12", "40", "46", "53", "501"]
SOURCE_PATTERNS = {
    "12": {
        "count": 39,
        "digest": "d64814100fc6e3f5c2ddf3c7b664b2d8a5a2044b932e462335c4e2d1056d734b",
        "route_id": "c453217f-9f9d-49ce-8b32-14a6b7013691",
        "trip_id": "25055",
        "first": "Teatr Zhastar",
        "last": "Mechet' Al'zhan Ana",
    },
    "46": {
        "count": 41,
        "digest": "a14d81cc8b349c9cf2c8de22f062d4b2170afa9f4e42e664cc96347b43d64fde",
        "route_id": "a3d30efc-b517-4ed6-b6a7-f5a87a3d5fa0",
        "trip_id": "28695",
        "first": "Mu'sa dukeni",
        "last": "Karakat",
    },
}
TILE = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class MoreRoutesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stop_data = json.loads(
            (Path(__file__).resolve().parents[1] / "data/astana-stops.json").read_text()
        )
        cls.source_by_id = {stop["id"]: stop for stop in cls.stop_data["stops"]}
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("SMARTBUS_CHROMIUM", "/usr/bin/chromium"),
            headless=True, args=["--no-sandbox"],
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context()
        self.context.route("https://tile.openstreetmap.org/**", lambda route:
                           route.fulfill(status=200, content_type="image/png", body=TILE))
        self.page = self.context.new_page()
        self.page.set_default_timeout(5000)
        self.errors = []
        self.bad_local_responses = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("response", lambda response:
                     self.bad_local_responses.append(response.url)
                     if response.url.startswith(BASE_URL) and response.status >= 400 else None)
        response = self.page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("#routeSelect option")).to_have_count(6)
        expect(self.page.locator("#routeMap")).to_have_attribute("data-map-state", "ready")

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.bad_local_responses, [], "Failed local app/asset requests")
        finally:
            self.context.close()

    def guest(self):
        self.page.click("#continueGuestBtn")
        expect(self.page.locator("#headerUserName")).to_have_text("Guest")

    def navigate(self, name):
        self.page.click(f'.nav-btn[data-page="{name}"]')
        expect(self.page.locator(f"#page-{name}")).to_be_visible()

    def trips(self):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key))", GUEST_TRIPS)

    def test_six_route_selectors_and_new_ordered_stops_have_verified_source_locations(self):
        expected_options = [{"value": route, "text": "Bus " + route} for route in ROUTE_IDS]
        for selector in ["#routeSelect", "#analyticsRouteSelect", "#savedFilter"]:
            with self.subTest(selector=selector):
                expected = ([{"value": "all", "text": "All routes"}]
                            if selector == "#savedFilter" else []) + expected_options
                self.assertEqual(self.page.locator(selector + " option").evaluate_all(
                    "options => options.map(option => ({value: option.value, text: option.textContent}))"),
                    expected)
        self.assertEqual(len(self.source_by_id), 201)
        expect(self.page.locator("#routeMap .source-stop-marker")).to_have_count(201)
        for route, pattern in SOURCE_PATTERNS.items():
            with self.subTest(route=route):
                count = pattern["count"]
                matches = self.stop_data["routeMatches"][route]
                self.assertEqual(sorted(matches, key=int), [str(index) for index in range(count)])
                ordered_ids = [matches[str(index)] for index in range(count)]
                self.assertEqual(hashlib.sha256("\n".join(ordered_ids).encode()).hexdigest(),
                                 pattern["digest"], "The full observed source order must be retained")
                expected_stops = [self.source_by_id[stop_id] for stop_id in ordered_ids]
                expected_names = [stop["name"] for stop in expected_stops]
                self.assertEqual((expected_names[0], expected_names[-1]),
                                 (pattern["first"], pattern["last"]))
                model = self.page.evaluate("id => window.SmartBusModel.ROUTES[id]", route)
                self.assertEqual(model["stops"], expected_names)
                self.assertEqual(model["capacity"], 100)
                self.assertTrue(model["simulation"]["capacityIsAssumption"])
                self.assertRegex(model["simulation"]["capacityAssumptionNote"], r"assumption.*not measured")
                source = model["source"]
                self.assertEqual((source["routeId"], source["routeShortName"],
                                  source["directionId"], source["representativeTripId"]),
                                 (pattern["route_id"], route, "1", pattern["trip_id"]))
                self.assertEqual((source["coverageStart"], source["coverageEnd"]),
                                 ("2024-07-29", "2024-09-21"))
                self.assertEqual(source["license"], "CC BY 4.0")
                self.assertTrue(source["routeSequenceUrl"].endswith("/stop_times.txt"))
                self.assertIn("Historical observed trip pattern", source["limitations"])
                self.assertEqual(self.stop_data["routeCatalog"][route], {
                    "source": source, "simulation": model["simulation"], "stopCount": count,
                })
                self.page.select_option("#routeSelect", route)
                self.assertEqual(self.page.locator("#stopSelect option").all_text_contents(), expected_names)
                expect(self.page.locator("#stopList .stop-item")).to_have_count(count)
                expect(self.page.locator("#routeMap .route-stop-marker")).to_have_count(count)
                marker_ids = self.page.locator("#routeMap .route-stop-marker").evaluate_all(
                    "markers => markers.sort((a,b) => a.dataset.stopIndex-b.dataset.stopIndex)"
                    ".map(marker => marker.dataset.sourceId)")
                self.assertEqual(marker_ids, ordered_ids)
                self.assertEqual(self.page.evaluate(
                    "id => window.SmartBusMapData.getCoordinates(id)", route),
                    [[stop["lat"], stop["lon"]] for stop in expected_stops])
                self.page.locator(f'.route-stop-marker[data-stop-index="{count - 1}"]').click()
                expect(self.page.locator("#stopSelect")).to_have_value(str(count - 1))
                expect(self.page.locator("#heroStop")).to_have_text(pattern["last"])
                expect(self.page.locator("#routeCatalogMessage")).to_contain_text("6 routes available")
                expect(self.page.locator("#routeCatalogMessage")).to_contain_text("historical 2024")

    def test_new_routes_keep_custom_comparison_time_after_save_reload_filter_and_analytics(self):
        self.guest()
        expected = {}
        for route, stop_index, hour, minute, chosen_time in [
            ("12", 38, "18", "45", "19:15"),
            ("46", 20, "07", "40", "08:10"),
        ]:
            with self.subTest(route=route):
                self.page.select_option("#routeSelect", route)
                self.page.select_option("#stopSelect", str(stop_index))
                self.page.select_option("#timeHour", hour)
                self.page.select_option("#timeMinute", minute)
                expect(self.page.locator("#heroTime")).to_have_text(hour + ":" + minute)
                choice = self.page.locator('.comparison-option[data-offset="30"]')
                choice.click()
                expect(choice).to_have_attribute("aria-pressed", "true")
                expect(self.page.locator("#heroTime")).to_have_text(chosen_time)
                occupancy = int(self.page.locator("#occupancyMetric").inner_text().rstrip("%"))
                expected[route] = {"time": chosen_time, "stopIndex": stop_index,
                                   "stop": self.page.locator("#heroStop").inner_text(),
                                   "occupancy": occupancy}
                self.page.click("#saveTripBtn")
                expect(self.page.locator("#predictionMessage")).to_contain_text("Saved Bus " + route)
        self.page.reload(wait_until="networkidle")
        trips = self.trips()
        self.assertEqual(len(trips), 2)
        for trip in trips:
            self.assertEqual({key: trip[key] for key in expected[trip["routeId"]]},
                             expected[trip["routeId"]])
            self.assertEqual((trip["capacity"], trip["passengers"], trip["dayOffset"]),
                             (100, trip["occupancy"], 0))
        self.navigate("saved")
        for route in ["12", "46"]:
            self.page.select_option("#savedFilter", route)
            expect(self.page.locator(".saved-trip")).to_have_count(1)
            expect(self.page.locator(".saved-trip")).to_contain_text("Bus " + route)
            expect(self.page.locator(".saved-trip")).to_contain_text(expected[route]["time"])
            expect(self.page.locator(".saved-trip")).to_contain_text(expected[route]["stop"])
        self.page.select_option("#savedFilter", "all")
        expect(self.page.locator(".saved-trip")).to_have_count(2)
        self.navigate("analytics")
        values = [trip["occupancy"] for trip in trips]
        expect(self.page.locator("#savedCount")).to_have_text("2")
        expect(self.page.locator("#savedAverage")).to_have_text(str((sum(values) + 1) // 2) + "%")
        expect(self.page.locator("#savedMaximum")).to_have_text(str(max(values)) + "%")
        self.assertEqual(self.page.locator("#savedBarChart .bar-label").all_text_contents(),
                         ["Bus 12", "Bus 46"])

    def test_both_new_routes_update_simulated_analytics_without_stale_route_results(self):
        # Fixed outputs of the demonstration model, not real passenger observations.
        series = {
            "12": ([48, 73, 58, 53, 58, 68, 78, 55, 43], 59, 78, 1),
            "46": ([55, 80, 65, 60, 65, 75, 85, 62, 50], 66, 85, 3),
        }
        self.navigate("analytics")
        for route in ["12", "46", "12"]:
            with self.subTest(route=route):
                values, average, maximum, high = series[route]
                self.page.select_option("#analyticsRouteSelect", route)
                self.assertEqual(self.page.locator("#barChart .bar-value").all_text_contents(),
                                 [str(value) + "%" for value in values])
                expect(self.page.locator("#analyticsAverage")).to_have_text(str(average) + "%")
                expect(self.page.locator("#analyticsMaximum")).to_have_text(str(maximum) + "%")
                expect(self.page.locator("#analyticsHigh")).to_have_text(str(high))
                expect(self.page.locator("#analyticsBusiest")).to_have_text("18:00")
                expect(self.page.locator("#analyticsDecision")).to_contain_text("not live demand data")

    def test_distinct_same_named_source_stops_save_separately_and_exact_duplicate_is_blocked(self):
        self.guest()
        self.page.select_option("#routeSelect", "46")
        matches = self.stop_data["routeMatches"]["46"]
        self.assertNotEqual(matches["9"], matches["11"])
        self.page.select_option("#timeHour", "18")
        self.page.select_option("#timeMinute", "25")
        for index in [9, 11]:
            self.page.select_option("#stopSelect", str(index))
            expect(self.page.locator("#heroStop")).to_have_text("Shugyla")
            self.page.click("#saveTripBtn")
            expect(self.page.locator("#predictionMessage")).to_contain_text("Saved Bus 46")
        self.assertEqual(sorted(trip["stopIndex"] for trip in self.trips()), [9, 11])
        self.page.click("#saveTripBtn")
        expect(self.page.locator("#predictionMessage")).to_contain_text(re.compile("already saved", re.I))
        self.assertEqual(len(self.trips()), 2)
        self.page.reload(wait_until="networkidle")
        self.assertEqual(sorted(trip["stopIndex"] for trip in self.trips()), [9, 11])
        self.navigate("saved")
        self.page.select_option("#savedFilter", "46")
        expect(self.page.locator(".saved-trip")).to_have_count(2)
        rows = self.page.locator(".saved-trip").all_text_contents()
        self.assertTrue(all("Shugyla" in row and "18:25" in row for row in rows))
        self.assertTrue(any("Stop 10" in row for row in rows))
        self.assertTrue(any("Stop 12" in row for row in rows))


if __name__ == "__main__":
    unittest.main(verbosity=2)
