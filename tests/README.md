# Browser regression checks

These automated checks exercise the working application in Chromium. They do **not**
replace the Endterm requirement for two people outside the team to try the same task.

Start the application from the repository root in one terminal:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In another terminal, from the repository root:

```sh
python3 -m unittest discover -s tests -v
```

Prerequisites: Python 3, Python package `playwright`, system Chromium at
`/usr/bin/chromium`. These tools are already present in the prepared cloud
environment. Elsewhere, install Playwright and Chromium using their supported,
TLS-verified distribution channels. `SMARTBUS_CHROMIUM` overrides the executable
path; `SMARTBUS_TEST_URL` overrides `http://127.0.0.1:8765`.

Every test uses an isolated browser context and test-only accounts. Tests preserve
the real browser profile and do not write application source files. The tests use
Chromium's `--no-sandbox` flag for the isolated cloud container. The command
sandbox may require the supported escalation flow for local sockets/Chromium.

Checks cover the complete scenario, selected-trip persistence and deletion,
data-derived analytics, required/secondary validation, local password derivation
and legacy-account migration (including recovery of old spaces-only passwords),
account separation, midnight/ties, all six route selectors, historical routes 12
and 46 with source-verified stop order and coordinates, their comparison/save/
filter/analytics flows, distinct same-named stops, inert HTML data, corrupt storage,
quota failures, navigation and
mobile page width. Every test also checks for uncaught JavaScript errors and failed
HTTP responses. A nonzero exit status means a check failed; do not suppress it.
