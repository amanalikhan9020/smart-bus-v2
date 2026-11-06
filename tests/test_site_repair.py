"""Regressions for the published site's map, clock and older-browser failures.

The application loads its real, checked-in historical stop dataset. Only the
third-party street tiles are replaced by an offline fixture.
"""
import base64
import json
import os
from pathlib import Path
import re
import unittest
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("SMARTBUS_TEST_URL", "http://127.0.0.1:8765")
GUEST_TRIPS = "smartbus_trips_v4_guest"
TILE = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class PublishedSiteRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stop_data = json.loads(
            (Path(__file__).resolve().parents[1] / "data/astana-stops.json").read_text()
        )
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
        self.local_responses = []
        self.expected_http_failures = set()
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("response", lambda response: self.local_responses.append(
            (response.url, response.status)) if response.url.startswith(BASE_URL) else None)

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            unexpected = [(url, status) for url, status in self.local_responses
                          if status >= 400 and
                          (urlparse(url).path.rsplit("/", 1)[-1], status)
                          not in self.expected_http_failures]
            self.assertEqual(unexpected, [], "Failed local app/asset requests")
        finally:
            self.context.close()

    def load(self, map_ready=True):
        response = self.page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("#routeSelect option")).to_have_count(6)
        expect(self.page.locator("#predictBtn")).to_be_enabled()
        if map_ready:
            expect(self.page.locator("#routeMap")).to_have_attribute("data-map-state", "ready")

    def guest(self):
        self.page.click("#continueGuestBtn")
        expect(self.page.locator("#headerUserName")).to_have_text("Guest")

    def trips(self):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key))", GUEST_TRIPS)

    def choose_time(self, hour="19", minute="30"):
        self.page.select_option("#timeHour", hour)
        self.page.select_option("#timeMinute", minute)

    def test_missing_recent_browser_apis_do_not_break_routes_map_or_saved_forecast(self):
        self.context.add_init_script("""
            Object.hasOwn = undefined;
            Array.prototype.at = undefined;
            Object.defineProperty(window.crypto, 'randomUUID', {
                configurable: true, value: undefined
            });
        """)
        self.load()
        self.guest()
        self.assertFalse(self.page.evaluate("typeof Object.hasOwn === 'function'"))
        self.assertFalse(self.page.evaluate("typeof Array.prototype.at === 'function'"))
        self.assertFalse(self.page.evaluate("typeof crypto.randomUUID === 'function'"))
        expect(self.page.locator("#routeMap .source-stop-marker")).to_have_count(201)
        self.page.select_option("#routeSelect", "501")
        self.page.select_option("#stopSelect", "0")
        self.choose_time()
        expect(self.page.locator("#heroTime")).to_have_text("19:30")
        expect(self.page.locator("#occupancyMetric")).to_have_text(re.compile(r"^\d+%$"))
        self.page.click("#saveTripBtn")
        trip = self.trips()[0]
        self.assertEqual((trip["routeId"], trip["time"]), ("501", "19:30"))
        self.assertRegex(trip["id"], r"^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$")
        self.page.reload(wait_until="networkidle")
        self.page.click('.nav-btn[data-page="saved"]')
        expect(self.page.locator(".saved-trip")).to_contain_text("19:30")

    def test_unavailable_crypto_identifier_generators_still_allow_guest_trips(self):
        self.context.add_init_script("""
            for (const name of ['randomUUID', 'getRandomValues']) {
                Object.defineProperty(window.crypto, name, {
                    configurable: true, value: undefined
                });
            }
        """)
        self.load()
        self.guest()
        for minute in ["00", "30"]:
            self.choose_time("19", minute)
            expect(self.page.locator("#heroTime")).to_have_text("19:" + minute)
            self.page.click("#saveTripBtn")
        trips = self.trips()
        self.assertEqual([trip["time"] for trip in trips], ["19:30", "19:00"])
        self.assertEqual(len({trip["id"] for trip in trips}), 2)

    def test_hour_minute_picker_syncs_text_slider_hero_and_persistent_trip_on_phone(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.load()
        self.guest()
        expect(self.page.locator("#timeInput")).to_have_attribute("type", "text")
        expect(self.page.locator("#timeHour option")).to_have_count(24)
        expect(self.page.locator("#timeMinute option")).to_have_count(60)
        self.choose_time()
        expect(self.page.locator("#timeInput")).to_have_value("19:30")
        expect(self.page.locator("#timeRange")).to_have_value("1170")
        expect(self.page.locator("#timeRangeLabel")).to_have_text("19:30")
        expect(self.page.locator("#heroTime")).to_have_text("19:30")
        expect(self.page.locator("#occupancyMetric")).to_have_text(re.compile(r"^\d+%$"))
        self.page.click("#saveTripBtn")
        self.assertEqual(self.trips()[0]["time"], "19:30")
        self.page.reload(wait_until="networkidle")
        self.page.click('.nav-btn[data-page="saved"]')
        expect(self.page.locator(".saved-trip")).to_contain_text("19:30")

    def test_invalid_text_never_saves_the_previous_forecast_and_picker_recovers(self):
        self.load()
        self.guest()
        for invalid in ["", "25:00", "19:70", "abc", "9:03"]:
            with self.subTest(time=invalid):
                self.page.fill("#timeInput", invalid)
                expect(self.page.locator("#occupancyMetric")).to_have_text("—")
                expect(self.page.locator("#heroTime")).to_have_text("—")
                self.page.click("#saveTripBtn")
                self.assertIn(self.trips(), [None, []])
                expect(self.page.locator("#predictionMessage")).to_contain_text(
                    re.compile("time|valid", re.I))
        self.choose_time()
        expect(self.page.locator("#timeInput")).to_have_value("19:30")
        expect(self.page.locator("#timeRange")).to_have_value("1170")
        self.page.click("#saveTripBtn")
        self.assertEqual([trip["time"] for trip in self.trips()], ["19:30"])

    def test_all_relative_scripts_styles_and_stop_data_use_one_cache_version(self):
        self.load()
        version = self.page.locator('meta[name="smartbus-version"]').get_attribute("content")
        self.assertTrue(version)
        assets = self.page.locator('script[src], link[rel="stylesheet"]').evaluate_all(
            "elements => elements.map(el => el.getAttribute(el.tagName === 'SCRIPT' ? 'src' : 'href'))")
        self.assertGreaterEqual(len(assets), 3)
        for asset in assets:
            with self.subTest(asset=asset):
                parsed = urlparse(asset)
                self.assertFalse(parsed.scheme or parsed.netloc or asset.startswith("/"))
                self.assertIn(Path(parsed.path).suffix, [".js", ".css"])
                self.assertEqual(parse_qs(parsed.query).get("v"), [version])
        source_requests = [url for url, _ in self.local_responses
                           if urlparse(url).path.endswith("/data/astana-stops.json")]
        self.assertTrue(source_requests, "The app must load the real local stop dataset")
        for url in source_requests:
            self.assertEqual(parse_qs(urlparse(url).query).get("v"), [version])

    def test_map_uses_exact_published_coordinates_and_exposes_source_and_license(self):
        self.load()
        expected_stops = self.stop_data["stops"]
        self.assertEqual(len(expected_stops), 201)
        self.assertEqual(len({stop["id"] for stop in expected_stops}), 201)
        # A fixed source row prevents a generated city grid from replacing the
        # historical fixture while still satisfying only a count assertion.
        first = next(stop for stop in expected_stops
                     if stop["id"] == "69d3a2a0-c1c5-4c40-9930-6f7f2fa2ae2a")
        self.assertAlmostEqual(first["lat"], 51.18512276135868, places=12)
        self.assertAlmostEqual(first["lon"], 71.3528443759532, places=12)
        rendered_ids = self.page.locator("#routeMap .source-stop-marker").evaluate_all(
            "markers => markers.map(marker => marker.dataset.sourceId)")
        self.assertEqual(sorted(rendered_ids), sorted(stop["id"] for stop in expected_stops))
        actual_stops = self.page.evaluate("window.SmartBusMapData.getData().stops")
        self.assertEqual(actual_stops, expected_stops)
        source_link = self.page.locator("#mapDataSource")
        expect(source_link).to_have_attribute("href", self.stop_data["source"]["url"])
        expect(source_link).to_contain_text(self.stop_data["source"]["license"])
        expect(self.page.locator("#mapStatus")).to_contain_text("201 source stops")
        expect(self.page.locator(".map-disclaimer")).to_contain_text(re.compile("historical|historic", re.I))
        source_by_id = {stop["id"]: stop for stop in expected_stops}
        route_lengths = {"10": 36, "40": 10, "53": 11, "501": 18}
        for route, count in route_lengths.items():
            with self.subTest(route=route):
                matches = self.stop_data["routeMatches"].get(route, {})
                expected = [[source_by_id[matches[str(index)]]["lat"],
                             source_by_id[matches[str(index)]]["lon"]]
                            if str(index) in matches else None for index in range(count)]
                self.assertEqual(self.page.evaluate(
                    "route => window.SmartBusMapData.getCoordinates(route)", route), expected)
        index = min(self.stop_data["routeMatches"]["10"], key=int)
        matched = source_by_id[self.stop_data["routeMatches"]["10"][index]]
        self.page.locator(f'.route-stop-marker[data-stop-index="{index}"]').click()
        popup = self.page.locator(".leaflet-popup-content")
        expect(popup).to_contain_text(matched["name"])
        expect(popup).to_contain_text(f'{matched["lat"]:.6f}, {matched["lon"]:.6f}')
        expect(popup).to_contain_text(self.stop_data["source"]["license"])

    def test_failed_stop_fetch_shows_error_without_fake_locations_and_can_retry(self):
        self.expected_http_failures.add(("astana-stops.json", 503))
        self.context.route("**/data/astana-stops.json*", lambda route:
                           route.fulfill(status=503, content_type="application/json", body="{}"))
        self.load(map_ready=False)
        expect(self.page.locator("#routeMap")).to_have_attribute("data-map-state", "error")
        expect(self.page.locator("#mapStatus")).to_contain_text(re.compile("could not|cannot|failed", re.I))
        expect(self.page.locator("#routeMap .source-stop-marker")).to_have_count(0)
        expect(self.page.locator("#routeMap .route-stop-marker")).to_have_count(0)
        self.guest()
        self.choose_time()
        expect(self.page.locator("#heroTime")).to_have_text("19:30")
        expect(self.page.locator("#occupancyMetric")).to_have_text(re.compile(r"^\d+%$"))
        self.page.click("#saveTripBtn")
        self.assertEqual(self.trips()[0]["time"], "19:30")
        self.context.unroute("**/data/astana-stops.json*")
        self.page.click("#mapRetryBtn")
        expect(self.page.locator("#routeMap")).to_have_attribute("data-map-state", "ready")
        expect(self.page.locator("#routeMap .source-stop-marker")).to_have_count(201)
        expect(self.page.locator("#timeInput")).to_have_value("19:30")

    def test_open_map_shortcut_reveals_map_on_phone(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.load()
        self.page.click("#openMapBtn")
        expect(self.page.locator("#routeMap")).to_be_in_viewport(ratio=0.5)
        self.assertGreater(self.page.locator("#routeMap").bounding_box()["height"], 180)
        expect(self.page.locator("#routeMap .source-stop-marker")).to_have_count(201)
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
