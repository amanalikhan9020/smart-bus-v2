"""Endterm browser regression checks (not a substitute for two human testers).

Start the app with Python's static HTTP server, then run:
    python3 -m unittest discover -s tests -v
Requires Python Playwright and system Chromium; see tests/README.md.
"""
import json
import base64
import os
import re
import unittest

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("SMARTBUS_TEST_URL", "http://127.0.0.1:8765")
USERS = "smartbus_users_v4"
CURRENT = "smartbus_current_v4"
GUEST_TRIPS = "smartbus_trips_v4_guest"


class SmartBusBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("SMARTBUS_CHROMIUM", "/usr/bin/chromium"),
            headless=True,
            args=["--no-sandbox"],
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context()
        # Third-party map tiles are deterministic fixtures here; the dedicated
        # map tests separately exercise a completely unavailable tile service.
        tile = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
        self.context.route("https://tile.openstreetmap.org/**", lambda route:
                           route.fulfill(status=200, content_type="image/png", body=tile))
        self.page = self.context.new_page()
        self.page.set_default_timeout(5000)
        self.errors = []
        self.bad_responses = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on(
            "response", lambda response: self.bad_responses.append(response.url)
            if response.status >= 400 else None,
        )
        response = self.page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        self.ready()

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "Uncaught JavaScript errors")
            self.assertEqual(self.bad_responses, [], "Failed app/asset requests")
        finally:
            self.context.close()

    def ready(self):
        expect(self.page.locator("#routeSelect option")).to_have_count(6)
        expect(self.page.locator("#predictBtn")).to_be_enabled()

    def navigate(self, page):
        self.page.click(f'.nav-btn[data-page="{page}"]')
        expect(self.page.locator(f"#page-{page}")).to_be_visible()

    def guest(self):
        self.page.click("#continueGuestBtn")
        expect(self.page.locator("#headerUserName")).to_have_text("Guest")

    def predict(self, route="10", time="18:00", stop="0"):
        self.page.select_option("#routeSelect", route)
        self.page.select_option("#stopSelect", stop)
        self.page.fill("#timeInput", time)
        self.page.click("#predictBtn")

    def stored(self, key):
        return self.page.evaluate("key => JSON.parse(localStorage.getItem(key))", key)

    def fill_registration(self, **overrides):
        values = {
            "registerName": "Test Passenger",
            "registerEmail": "passenger@example.invalid",
            "registerPassword": "test password 123",
            "registerConfirm": "test password 123",
        }
        values.update(overrides)
        for field, value in values.items():
            self.page.fill("#" + field, value)

    def register(self, email="passenger@example.invalid", name="Test Passenger",
                 password="test password 123"):
        self.page.click("#openRegisterBtn")
        self.fill_registration(registerName=name, registerEmail=email,
                               registerPassword=password, registerConfirm=password)
        self.page.click("#createAccountBtn")
        expect(self.page.locator("#registerModal")).to_be_hidden()
        expect(self.page.locator("#userActions")).to_be_visible()

    def login(self, email="passenger@example.invalid", password="test password 123"):
        self.page.click("#openLoginBtn")
        self.page.fill("#loginEmail", email)
        self.page.fill("#loginPassword", password)
        self.page.click("#loginSubmitBtn")
        expect(self.page.locator("#loginModal")).to_be_hidden()

    def feedback(self):
        return " ".join(self.page.locator(selector).inner_text()
                        for selector in ["#predictionMessage", "#appMessage"])

    def test_connected_scenario_preserves_selected_variant_after_reload(self):
        self.guest()
        self.predict()
        expect(self.page.locator("#occupancyMetric")).to_have_text("56%")
        option = self.page.locator('.comparison-option[data-offset="60"]')
        option.click()
        expect(option).to_have_attribute("aria-pressed", "true")
        expect(self.page.locator("#occupancyMetric")).to_have_text("49%")
        self.page.click("#saveTripBtn")
        self.assertRegex(self.feedback().lower(), r"saved|success")
        trips = self.stored(GUEST_TRIPS)
        self.assertEqual(len(trips), 1)
        self.assertEqual(trips[0]["time"], "19:00")
        self.assertEqual(trips[0]["occupancy"], 49)
        self.page.click("#saveTripBtn")
        self.assertEqual(len(self.stored(GUEST_TRIPS)), 1)
        self.assertRegex(self.feedback().lower(), r"already|duplicate")
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        expect(self.page.locator(".saved-trip")).to_contain_text("19:00")
        self.page.reload(wait_until="networkidle")
        self.ready()
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        expect(self.page.locator(".saved-trip")).to_contain_text("49%")
        self.page.select_option("#savedFilter", "501")
        expect(self.page.locator(".saved-trip")).to_have_count(0)
        self.page.select_option("#savedFilter", "all")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        self.page.click(".delete-btn")
        expect(self.page.locator(".saved-trip")).to_have_count(0)
        self.assertEqual(self.stored(GUEST_TRIPS), [])

    def test_saved_data_drives_metrics_and_chart_after_add_and_delete(self):
        self.guest()
        self.predict(time="18:00")
        self.page.click("#saveTripBtn")
        self.predict(time="19:00")
        self.page.click("#saveTripBtn")
        self.navigate("analytics")
        expect(self.page.locator("#savedCount")).to_have_text("2")
        expect(self.page.locator("#savedAverage")).to_have_text("53%")
        expect(self.page.locator("#savedMaximum")).to_have_text("56%")
        expect(self.page.locator("#savedBarChart .bar-column")).to_have_count(1)
        self.navigate("saved")
        self.page.locator(".delete-btn").first.click()
        self.navigate("analytics")
        expect(self.page.locator("#savedCount")).to_have_text("1")
        expect(self.page.locator("#savedAverage")).to_have_text("56%")
        self.navigate("saved")
        self.page.locator(".delete-btn").click()
        self.navigate("analytics")
        expect(self.page.locator("#savedCount")).to_have_text("0")
        expect(self.page.locator("#savedBarChart .bar-column")).to_have_count(0)
        self.assertTrue(self.page.locator("#savedAnalyticsMessage").inner_text().strip())

    def test_required_time_blocks_save_and_recovers_after_correction(self):
        self.guest()
        self.predict(time="")
        self.assertRegex(self.feedback().lower(), r"time")
        self.page.click("#saveTripBtn")
        self.assertIn(self.stored(GUEST_TRIPS), [None, []])
        self.assertNotRegex(self.feedback().lower(), r"successfully saved")
        self.predict(time="18:00")
        self.page.click("#saveTripBtn")
        self.assertEqual(len(self.stored(GUEST_TRIPS)), 1)

    def test_no_user_cannot_save_and_receives_actionable_feedback(self):
        self.page.click("#saveTripBtn")
        self.assertIn(self.stored(GUEST_TRIPS), [None, []])
        self.assertRegex(self.feedback().lower(), r"guest|log in|sign in")

    def test_required_registration_fields_reject_empty_and_whitespace(self):
        self.page.click("#openRegisterBtn")
        for field, label in [
            ("registerName", "name"), ("registerEmail", "email"),
            ("registerPassword", "password"), ("registerConfirm", "confirm"),
        ]:
            for invalid in ["", "      "]:
                with self.subTest(field=field, value=repr(invalid)):
                    self.fill_registration(**{field: invalid})
                    self.page.click("#createAccountBtn")
                    expect(self.page.locator("#registerError")).to_contain_text(
                        re.compile(label, re.I))
                    self.assertIn(self.stored(USERS), [None, []])
                    self.assertIsNone(self.stored(CURRENT))
        self.fill_registration()
        self.page.click("#createAccountBtn")
        expect(self.page.locator("#registerModal")).to_be_hidden()
        self.assertEqual(len(self.stored(USERS)), 1)

    def test_secondary_validation_email_password_and_duplicate(self):
        self.page.click("#openRegisterBtn")
        for overrides, message in [
            ({"registerEmail": "not-an-email"}, "email"),
            ({"registerPassword": "123", "registerConfirm": "123"}, "password"),
            ({"registerConfirm": "does-not-match"}, "match"),
        ]:
            self.fill_registration(**overrides)
            self.page.click("#createAccountBtn")
            expect(self.page.locator("#registerError")).to_contain_text(re.compile(message, re.I))
            self.assertIn(self.stored(USERS), [None, []])
        self.fill_registration()
        self.page.click("#createAccountBtn")
        expect(self.page.locator("#registerModal")).to_be_hidden()
        self.page.click("#logoutBtn")
        self.page.click("#openRegisterBtn")
        self.fill_registration(registerEmail="PASSENGER@example.invalid")
        self.page.click("#createAccountBtn")
        expect(self.page.locator("#registerError")).to_contain_text(re.compile("already|registered|exists", re.I))
        self.assertEqual(len(self.stored(USERS)), 1)

    def test_password_derivation_and_invalid_login(self):
        password = " pass with spaces "
        self.register(password=password)
        records = self.stored(USERS)
        session = self.stored(CURRENT)
        self.assertNotIn(password, json.dumps(records))
        self.assertNotIn(password, json.dumps(session))
        self.assertNotIn("password", records[0])
        self.assertNotIn("password", session)
        self.page.click("#logoutBtn")
        self.page.click("#openLoginBtn")
        self.page.fill("#loginEmail", "passenger@example.invalid")
        self.page.fill("#loginPassword", "wrong-password")
        self.page.click("#loginSubmitBtn")
        expect(self.page.locator("#loginError")).to_contain_text(re.compile("incorrect|invalid|wrong", re.I))
        self.assertIsNone(self.stored(CURRENT))
        self.page.fill("#loginPassword", password)
        self.page.click("#loginSubmitBtn")
        expect(self.page.locator("#loginModal")).to_be_hidden()
        expect(self.page.locator("#headerUserName")).to_have_text("Test")

    def test_login_required_fields_and_email_format_are_explicit(self):
        self.page.click("#openLoginBtn")
        for email, password, label in [
            ("", "valid password", "email"),
            ("   ", "valid password", "email"),
            ("passenger@example.invalid", "", "password"),
            ("passenger@example.invalid", "      ", "password"),
            ("invalid-email", "valid password", "email"),
        ]:
            with self.subTest(email=email, password=repr(password)):
                self.page.fill("#loginEmail", email)
                self.page.fill("#loginPassword", password)
                self.page.click("#loginSubmitBtn")
                expect(self.page.locator("#loginError")).to_contain_text(re.compile(label, re.I))
                self.assertIsNone(self.stored(CURRENT))

    def test_registered_users_keep_separate_trip_collections(self):
        self.register(email="first@example.invalid")
        first_id = self.stored(CURRENT)["id"]
        self.page.click("#saveTripBtn")
        self.page.click("#logoutBtn")
        self.register(email="second@example.invalid")
        second_id = self.stored(CURRENT)["id"]
        self.assertNotEqual(first_id, second_id)
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(0)
        self.page.click("#logoutBtn")
        self.login(email="first@example.invalid")
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        self.assertEqual(len(self.stored("smartbus_trips_v4_" + first_id)), 1)

    def test_legacy_account_migration_preserves_id_trips_and_login(self):
        legacy = {"id": "legacy-passenger", "name": "Legacy Passenger",
                  "email": "legacy@example.invalid", "password": "legacy password",
                  "type": "Registered user"}
        trip = {"id": 1, "routeId": "10", "routeName": "Bus 10",
                "stop": "Ж/д вокзал Астана 1", "time": "18:00", "occupancy": 56,
                "passengers": 56, "capacity": 100}
        self.page.evaluate("([u,c,t,user,trip]) => { localStorage.setItem(u,JSON.stringify([user])); localStorage.setItem(c,JSON.stringify(user)); localStorage.setItem(t,JSON.stringify([trip])); }",
                           [USERS, CURRENT, "smartbus_trips_v4_legacy-passenger", legacy, trip])
        self.page.reload(wait_until="networkidle")
        self.ready()
        expect(self.page.locator("#headerUserName")).to_have_text("Legacy")
        self.assertEqual(self.stored(USERS)[0]["id"], "legacy-passenger")
        self.assertNotIn("password", self.stored(USERS)[0])
        self.assertNotIn("password", self.stored(CURRENT))
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        self.page.click("#logoutBtn")
        self.login(email="legacy@example.invalid", password="legacy password")
        self.assertEqual(self.stored(CURRENT)["id"], "legacy-passenger")

    def test_legacy_blank_password_recovery_preserves_account_and_trips(self):
        legacy = {"id": "legacy-blank-password", "name": "Legacy Blank",
                  "email": "legacy-blank@example.invalid", "password": "      ",
                  "type": "Registered user"}
        trip = {"id": 1, "routeId": "10", "routeName": "Bus 10",
                "stop": "Ж/д вокзал Астана 1", "time": "18:00", "occupancy": 56,
                "passengers": 56, "capacity": 100}
        trip_key = "smartbus_trips_v4_legacy-blank-password"
        self.page.evaluate("([u,c,t,user,trip]) => { localStorage.setItem(u,JSON.stringify([user])); localStorage.setItem(c,JSON.stringify(user)); localStorage.setItem(t,JSON.stringify([trip])); }",
                           [USERS, CURRENT, trip_key, legacy, trip])
        raw_users = self.page.evaluate("key => localStorage.getItem(key)", USERS)
        raw_session = self.page.evaluate("key => localStorage.getItem(key)", CURRENT)
        raw_trips = self.page.evaluate("key => localStorage.getItem(key)", trip_key)
        self.page.reload(wait_until="networkidle")
        self.ready()
        expect(self.page.locator("#legacyRecovery")).to_be_visible()
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", USERS), raw_users)
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", CURRENT), raw_session)
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", trip_key), raw_trips)
        self.page.fill("#legacyEmail", legacy["email"])
        for invalid in ["", "      "]:
            with self.subTest(new_password=repr(invalid)):
                self.page.fill("#legacyPassword", invalid)
                self.page.fill("#legacyConfirm", invalid)
                self.page.click("#legacyRecoverBtn")
                expect(self.page.locator("#legacyError")).to_contain_text(re.compile("password", re.I))
                self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", USERS), raw_users)
                self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", trip_key), raw_trips)
        new_password = "recovered local password"
        self.page.fill("#legacyPassword", new_password)
        self.page.fill("#legacyConfirm", new_password)
        self.page.click("#legacyRecoverBtn")
        expect(self.page.locator("#legacyRecovery")).to_be_hidden()
        expect(self.page.locator("#headerUserName")).to_have_text("Legacy")
        user = self.stored(USERS)[0]
        self.assertEqual(user["id"], legacy["id"])
        self.assertNotIn("password", user)
        self.assertNotIn(new_password, json.dumps(user))
        self.assertNotIn("password", self.stored(CURRENT))
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", trip_key), raw_trips)
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        expect(self.page.locator(".saved-trip")).to_contain_text("18:00")
        self.page.click("#logoutBtn")
        self.login(email=legacy["email"], password=new_password)
        self.assertEqual(self.stored(CURRENT)["id"], legacy["id"])

    def test_midnight_comparison_tracks_next_day_in_saved_trip(self):
        self.guest()
        self.predict(time="23:45")
        self.page.locator('.comparison-option[data-offset="30"]').click()
        self.page.click("#saveTripBtn")
        trip = self.stored(GUEST_TRIPS)[0]
        self.assertEqual(trip["time"], "00:15")
        self.assertEqual(trip["dayOffset"], 1)
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_contain_text("00:15")
        expect(self.page.locator(".saved-trip")).to_contain_text(re.compile("next day|tomorrow|\\+1", re.I))

    def test_equal_comparison_results_are_reported_honestly(self):
        self.predict(time="12:00")
        values = []
        for offset in ["0", "30", "60"]:
            self.page.locator(f'.comparison-option[data-offset="{offset}"]').click()
            values.append(self.page.locator("#occupancyMetric").inner_text())
        self.assertEqual(len(set(values)), 1)
        expect(self.page.locator("#comparisonSummary")).to_contain_text(re.compile("same|equal|tie", re.I))

    def test_all_routes_search_and_original_simulated_analytics_work(self):
        for route, count in [("10", 36), ("40", 10), ("53", 11), ("501", 18)]:
            self.page.select_option("#routeSelect", route)
            expect(self.page.locator("#stopSelect option")).to_have_count(count)
        self.page.select_option("#routeSelect", "40")
        self.page.fill("#stopSearch", "ЭКСПО")
        expect(self.page.locator(".stop-item")).to_have_count(1)
        self.page.locator(".stop-item").click()
        expect(self.page.locator("#stopSelect")).to_have_value("1")
        self.page.fill("#stopSearch", "no-such-stop")
        expect(self.page.locator("#searchMessage")).to_contain_text(re.compile("not found|no stop", re.I))
        self.page.click("#clearSearchBtn")
        expect(self.page.locator(".stop-item")).to_have_count(10)
        self.navigate("analytics")
        expect(self.page.locator("#barChart .bar-column")).to_have_count(9)
        before = self.page.locator("#analyticsAverage").inner_text()
        self.page.select_option("#analyticsRouteSelect", "501")
        self.assertNotEqual(self.page.locator("#analyticsAverage").inner_text(), before)

    def test_user_text_and_stored_html_do_not_execute(self):
        payload = '<img src=x onerror="window.__smartbusXss=1">'
        self.register(name=payload)
        self.page.click("#profileBtn")
        expect(self.page.locator("#profileName")).to_have_text(payload)
        expect(self.page.locator("#profileName img")).to_have_count(0)
        user_id = self.stored(CURRENT)["id"]
        trip = {"id": 2, "routeId": "10", "routeName": "Bus 10", "stop": payload,
                "time": "18:00", "occupancy": 56, "passengers": 56, "capacity": 100,
                "dayOffset": 0}
        self.page.evaluate("([key,trip]) => localStorage.setItem(key,JSON.stringify([trip]))",
                           ["smartbus_trips_v4_" + user_id, trip])
        self.navigate("saved")
        expect(self.page.locator(".saved-trip img")).to_have_count(0)
        self.assertFalse(self.page.evaluate("Boolean(window.__smartbusXss)"))
        rows = self.page.locator(".saved-trip")
        if rows.count():
            expect(rows).to_contain_text(payload)
        else:
            self.assertRegex((self.page.locator("#appMessage").inner_text() +
                              self.page.locator("#savedTripsList").inner_text()).lower(),
                             r"invalid|corrupt|could not|cannot|unrecognized|does not match")

    def test_corrupt_saved_data_is_reported_and_not_overwritten(self):
        self.guest()
        self.page.evaluate("key => localStorage.setItem(key,'broken-json')", GUEST_TRIPS)
        self.navigate("saved")
        self.assertRegex((self.page.locator("#appMessage").inner_text() +
                          self.page.locator("#savedTripsList").inner_text()).lower(),
                         r"invalid|corrupt|damaged|could not|cannot|unreadable")
        self.navigate("home")
        self.page.click("#saveTripBtn")
        self.assertNotRegex(self.feedback().lower(), r"successfully saved")
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", GUEST_TRIPS),
                         "broken-json")

    def test_storage_quota_failure_never_claims_success(self):
        self.guest()
        self.page.evaluate("() => { Storage.prototype.setItem = function () { throw new DOMException('Test quota exceeded', 'QuotaExceededError'); }; }")
        self.page.click("#saveTripBtn")
        self.assertRegex(self.feedback().lower(), r"storage|space|save|quota")
        self.assertNotRegex(self.feedback().lower(), r"successfully saved|trip saved")
        self.assertIn(self.stored(GUEST_TRIPS), [None, []])

    def test_unknown_route_is_reported_without_stale_analytics_or_data_loss(self):
        self.guest()
        self.page.click("#saveTripBtn")
        self.navigate("analytics")
        expect(self.page.locator("#savedCount")).to_have_text("1")
        expect(self.page.locator("#savedBarChart .bar-column")).to_have_count(1)
        existing = self.stored(GUEST_TRIPS)
        invalid = dict(existing[0], id="unknown-route", routeId="999", routeName="Bus 999")
        self.page.evaluate("([key,data]) => localStorage.setItem(key, JSON.stringify(data))",
                           [GUEST_TRIPS, existing + [invalid]])
        raw = self.page.evaluate("key => localStorage.getItem(key)", GUEST_TRIPS)
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(0)
        self.assertRegex((self.page.locator("#appMessage").inner_text() +
                          self.page.locator("#savedTripsList").inner_text()).lower(),
                         r"invalid|unrecognized|unknown|route")
        self.navigate("analytics")
        expect(self.page.locator("#savedCount")).to_have_text("0")
        expect(self.page.locator("#savedBarChart .bar-column")).to_have_count(0)
        self.assertRegex(self.page.locator("#savedAnalyticsMessage").inner_text().lower(),
                         r"invalid|unrecognized|unknown|route")
        self.navigate("home")
        self.page.click("#saveTripBtn")
        self.assertNotRegex(self.feedback().lower(), r"successfully saved|trip saved")
        self.assertEqual(self.page.evaluate("key => localStorage.getItem(key)", GUEST_TRIPS), raw)

    def test_security_navigation_and_mobile_scenario_without_page_overflow(self):
        self.navigate("security")
        expect(self.page.locator("#page-security")).to_contain_text(re.compile("local|browser", re.I))
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.navigate("home")
        self.guest()
        self.predict()
        self.page.locator('.comparison-option[data-offset="60"]').click()
        self.page.click("#saveTripBtn")
        self.navigate("saved")
        expect(self.page.locator(".saved-trip")).to_have_count(1)
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
