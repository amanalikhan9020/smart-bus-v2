"""Map and departure-time integration checks; no live tile service is required.

Run after starting the static app server:
    python3 -m unittest discover -s tests -v
"""
import base64
import json
import os
from pathlib import Path
import re
import unittest

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("SMARTBUS_TEST_URL", "http://127.0.0.1:8765")
GUEST_TRIPS = "smartbus_trips_v4_guest"
# A valid transparent one-pixel tile keeps map tests deterministic and offline.
TILE = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class MapAndTimeTests(unittest.TestCase):
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
        self.bad_local_responses = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("response", lambda response:
                     self.bad_local_responses.append(response.url)
                     if response.url.startswith(BASE_URL) and response.status >= 400 else None)
        self.load()

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.bad_local_responses, [], "Failed local app/asset requests")
        finally:
            self.context.close()

    def load(self):
        response = self.page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("#routeSelect option")).to_have_count(4)
        expect(self.page.locator("#routeMap.leaflet-container")).to_have_count(1)
        expect(self.page.locator("#routeMap")).to_have_attribute("data-map-state", "ready")

    def mapped_indexes(self, route="10"):
        return sorted(self.stop_data["routeMatches"].get(route, {}), key=int)

    def marker(self, index):
        return self.page.locator(f'#routeMap .route-stop-marker[data-stop-index="{index}"]')

    def guest(self):
        self.page.click("#continueGuestBtn")
        expect(self.page.locator("#headerUserName")).to_have_text("Guest")

    def stored_trips(self):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key))", GUEST_TRIPS)

    def test_map_route_switch_and_stop_selection_stay_in_sync(self):
        self.page.fill("#timeInput", "19:00")
        for route, count in [("10", 36), ("40", 10), ("53", 11), ("501", 18)]:
            with self.subTest(route=route):
                self.page.select_option("#routeSelect", route)
                indexes = self.mapped_indexes(route)
                expect(self.page.locator("#stopSelect option")).to_have_count(count)
                expect(self.page.locator("#routeMap .route-stop-marker")).to_have_count(len(indexes))
                self.assertEqual(
                    sorted(self.page.locator("#routeMap .route-stop-marker").evaluate_all(
                        "markers => markers.map(marker => marker.dataset.stopIndex)"), key=int),
                    indexes,
                )
                self.marker(indexes[-1]).click()
                expect(self.page.locator("#stopSelect")).to_have_value(indexes[-1])
                selected_stop = self.page.locator("#stopSelect option:checked").inner_text()
                expect(self.page.locator("#mapSelection")).to_contain_text(selected_stop)
                expect(self.page.locator("#heroStop")).to_have_text(selected_stop)
                expect(self.page.locator("#timeInput")).to_have_value("19:00")
                self.page.select_option("#stopSelect", indexes[0])
                expect(self.marker(indexes[0])).to_have_attribute("aria-pressed", "true")
                missing = [str(index) for index in range(count) if str(index) not in indexes]
                self.assertTrue(missing, "The historical source has partial route coverage")
                self.page.select_option("#stopSelect", missing[0])
                expect(self.marker(missing[0])).to_have_count(0)
                expect(self.page.locator("#mapSelection")).to_contain_text(
                    re.compile("no verified location", re.I))
                expect(self.page.locator("#heroStop")).to_have_text(
                    self.page.locator("#stopSelect option:checked").inner_text())
                expect(self.page.locator("#occupancyMetric")).to_have_text(re.compile(r"^\d+%$"))
        expect(self.page.locator("#mapStatus")).to_contain_text(re.compile("source|GTFS", re.I))
        expect(self.page.locator(".leaflet-control-attribution")).to_contain_text("OpenStreetMap")

    def test_map_remains_usable_when_remote_tiles_are_unavailable(self):
        self.context.unroute("https://tile.openstreetmap.org/**")
        self.context.route("https://tile.openstreetmap.org/**", lambda route: route.abort())
        self.load()
        expect(self.page.locator("#mapStatus")).to_contain_text(
            re.compile("unavailable|offline|schematic|could not|cannot", re.I))
        indexes = self.mapped_indexes()
        expect(self.page.locator("#routeMap .route-stop-marker")).to_have_count(len(indexes))
        self.marker(indexes[-1]).click()
        expect(self.page.locator("#stopSelect")).to_have_value(indexes[-1])
        self.page.click("#mapFitRoute")
        expect(self.page.locator("#routeMap .route-stop-marker")).to_have_count(len(indexes))
        expect(self.page.locator("#occupancyMetric")).not_to_have_text("—")

    def test_keyboard_markers_select_stops_with_enter_and_space(self):
        self.page.select_option("#routeSelect", "10")
        indexes = self.mapped_indexes()
        marker = self.marker(indexes[-1])
        marker.focus()
        self.page.keyboard.press("Enter")
        expect(self.page.locator("#stopSelect")).to_have_value(indexes[-1])
        first = self.marker(indexes[0])
        first.focus()
        self.page.keyboard.press("Space")
        expect(self.page.locator("#stopSelect")).to_have_value(indexes[0])

    def test_typed_time_and_slider_update_prediction_without_submit(self):
        self.page.fill("#timeInput", "19:00")
        expect(self.page.locator("#occupancyMetric")).to_have_text("49%")
        expect(self.page.locator("#timeRange")).to_have_value("1140")
        expect(self.page.locator("#timeRangeLabel")).to_contain_text("19:00")
        self.page.locator("#timeRange").evaluate("el => { el.value='300'; el.dispatchEvent(new Event('input', {bubbles:true})); }")
        expect(self.page.locator("#timeInput")).to_have_value("05:00")
        expect(self.page.locator("#timeRangeLabel")).to_contain_text("05:00")
        expect(self.page.locator("#occupancyMetric")).to_have_text("10%")
        expect(self.page.locator('.comparison-option[data-offset="60"]')).to_contain_text("06:00")
        self.page.locator("#timeRange").focus()
        self.page.keyboard.press("ArrowRight")
        expect(self.page.locator("#timeInput")).to_have_value("05:01")

    def test_time_step_buttons_wrap_clock_at_midnight(self):
        self.page.fill("#timeInput", "23:55")
        self.page.click("#timeLaterBtn")
        expect(self.page.locator("#timeInput")).to_have_value("00:10")
        expect(self.page.locator("#timeRange")).to_have_value("10")
        expect(self.page.locator("#heroNext")).to_contain_text(re.compile("today", re.I))
        self.page.click("#timeEarlierBtn")
        expect(self.page.locator("#timeInput")).to_have_value("23:55")
        expect(self.page.locator("#timeRange")).to_have_value("1435")

    def test_now_uses_astana_clock(self):
        self.page.fill("#timeInput", "00:01")
        clock = "new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Almaty',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date())"
        before = self.page.evaluate(clock)
        self.page.click("#timeNowBtn")
        after = self.page.evaluate(clock)
        self.assertIn(self.page.locator("#timeInput").input_value(), [before, after])
        self.assertRegex(self.page.locator("#occupancyMetric").inner_text(), r"^\d+%$")

    def test_invalid_time_blocks_stale_prediction_and_can_be_corrected(self):
        self.guest()
        self.page.fill("#timeInput", "")
        expect(self.page.locator("#occupancyMetric")).to_have_text("—")
        self.page.click("#saveTripBtn")
        self.assertIn(self.stored_trips(), [None, []])
        expect(self.page.locator("#predictionMessage")).to_contain_text(re.compile("time|required", re.I))
        self.page.fill("#timeInput", "18:00")
        expect(self.page.locator("#occupancyMetric")).to_have_text("56%")
        self.page.click("#saveTripBtn")
        self.assertEqual(len(self.stored_trips()), 1)

    def test_map_stop_and_custom_time_persist_in_selected_trip(self):
        self.guest()
        self.page.select_option("#routeSelect", "10")
        self.marker(self.mapped_indexes()[-1]).click()
        stop = self.page.locator("#stopSelect option:checked").inner_text()
        self.page.fill("#timeInput", "19:00")
        alternative = self.page.locator('.comparison-option[data-offset="30"]')
        alternative.click()
        expect(alternative).to_have_attribute("aria-pressed", "true")
        expect(self.page.locator("#heroTime")).to_have_text("19:30")
        self.page.click("#saveTripBtn")
        trip = self.stored_trips()[0]
        self.assertEqual(trip["routeId"], "10")
        self.assertEqual(trip["stop"], stop)
        self.assertEqual(trip["time"], "19:30")
        self.page.reload(wait_until="networkidle")
        self.page.click('.nav-btn[data-page="saved"]')
        expect(self.page.locator(".saved-trip")).to_contain_text(stop)
        expect(self.page.locator(".saved-trip")).to_contain_text("19:30")

    def test_map_and_time_controls_work_on_phone_without_body_overflow(self):
        for width in [390, 320]:
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 844})
                self.page.select_option("#routeSelect", "10")
                self.page.fill("#timeInput", "17:45")
                self.page.click("#mapFitRoute")
                self.marker(self.mapped_indexes()[-1]).click()
                expect(self.page.locator("#stopSelect")).to_have_value(self.mapped_indexes()[-1])
                self.page.click("#timeLaterBtn")
                expect(self.page.locator("#timeInput")).to_have_value("18:00")
                self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
                self.assertGreater(self.page.locator("#routeMap").bounding_box()["height"], 180)
                self.page.click("#mapZoomIn")
                self.page.click("#mapZoomOut")
                self.page.click("#mapFitRoute")


if __name__ == "__main__":
    unittest.main(verbosity=2)
