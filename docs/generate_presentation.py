"""Build the six-slide Endterm draft. Requires reportlab and DejaVu Sans.

Fill only verified human/team evidence below, then review ENDTERM.md and rebuild.
This generator deliberately does not fabricate test outcomes or contributions.
"""
from pathlib import Path
import argparse
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description="Build the English Endterm draft or a clearly labelled illustrative example.")
parser.add_argument("--illustrative", action="store_true", help="Fill sample usability records; these are not actual human-test evidence.")
ILLUSTRATIVE = parser.parse_args().illustrative
OUTPUT = ROOT / ("endterm-en-example.pdf" if ILLUSTRATIVE else "endterm-en.pdf")
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DV", str(FONT_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DVB", str(FONT_DIR / "DejaVuSans-Bold.ttf")))

# Replace placeholders with confirmed facts; do not infer them from AI changes.
TEAM = "Amangeldi Alikhan · Kerimbayev Akarys · Kartbay Alim"
GROUP = "[Group number — to be provided]"
CONTRIBUTIONS = "Reported A4 work: Alikhan 33.3% — core logic/predictions; Akarys 33.3% — UI/charts; Alim 33.4% — validation/security/tests. Each member’s technical contribution AFTER A4: [confirm]."
USER_RESULTS = [
    ["User 1", "T1", "[Not provided]", "[Difficulties and feedback]"],
    ["User 2", "T1", "[Not provided]", "[Difficulties and feedback]"],
]
if ILLUSTRATIVE:
    USER_RESULTS = [
        ["Sample 1", "T1", "Completed independently", "Initially missed the departure-time field. Suggested a more visible time label."],
        ["Sample 2", "T1", "Completed with help", "Needed an explanation of occupancy percentages. Suggested showing the level thresholds."],
    ]
IMPROVEMENTS = [
    "1. [Actual feedback] → [Change] → [Before / after] → [Repeated task and result]",
    "2. [Actual feedback] → [Change] → [Before / after] → [Repeated task and result]",
]

WIDTH, HEIGHT = 960, 540
MARGIN = 48
BODY_WIDTH = WIDTH - MARGIN * 2
INK = colors.HexColor("#18324b")
MUTED = colors.HexColor("#49667b")
ACCENT = colors.HexColor("#067a68")
PALE = colors.HexColor("#edf7f4")
BASE = ParagraphStyle("base", fontName="DV", fontSize=16, leading=22, textColor=INK)
SMALL = ParagraphStyle("small", parent=BASE, fontSize=13, leading=18)
CELL = ParagraphStyle("cell", parent=BASE, fontSize=12, leading=17)

c = canvas.Canvas(str(OUTPUT), pagesize=(WIDTH, HEIGHT), pageCompression=1)
c.setTitle("SmartBus Astana — Endterm (illustrative usability examples)" if ILLUSTRATIVE else "SmartBus Astana — Endterm presentation (English draft)")
c.setAuthor(TEAM)
c.setSubject("Project Integration, Testing and Improvement — human testing and post-A4 contributions pending")
slide_count = 0
y = 0


def begin(title, subtitle):
    global slide_count, y
    slide_count += 1
    c.setFillColor(colors.white)
    c.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(0, HEIGHT - 10, WIDTH, 10, stroke=0, fill=1)
    c.setFont("DVB", 11)
    c.drawString(MARGIN, HEIGHT - 40, "SMARTBUS ASTANA  /  ENDTERM")
    c.setFillColor(colors.HexColor("#a64f12"))
    c.drawRightString(WIDTH - MARGIN, HEIGHT - 40, "ILLUSTRATIVE USABILITY DATA" if ILLUSTRATIVE else "DRAFT — EVIDENCE STILL REQUIRED")
    c.setFillColor(INK)
    c.setFont("DVB", 28)
    c.drawString(MARGIN, HEIGHT - 84, title)
    y = HEIGHT - 112
    add(subtitle, small=True, gap=18)


def add(text, small=False, gap=12, label=None):
    global y
    style = SMALL if small else BASE
    content = escape(text)
    if label:
        content = f'<font name="DVB">{escape(label)}</font> ' + content
    p = Paragraph(content, style)
    _, height = p.wrap(BODY_WIDTH, HEIGHT)
    if y - height < 64:
        raise ValueError(f"Slide {slide_count} overflows: {text[:60]}")
    p.drawOn(c, MARGIN, y - height)
    y -= height + gap


def table(rows, widths):
    global y
    data = [[Paragraph(escape(str(cell)), CELL) for cell in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbded8")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    _, height = t.wrap(BODY_WIDTH, HEIGHT)
    if y - height < 64:
        raise ValueError(f"Slide {slide_count} table overflows")
    t.drawOn(c, MARGIN, y - height)
    y -= height + 15


def finish():
    c.setStrokeColor(colors.HexColor("#dce7ed"))
    c.line(MARGIN, 49, WIDTH - MARGIN, 49)
    c.setFillColor(MUTED)
    c.setFont("DV", 9)
    c.drawString(MARGIN, 29, "Usability results are simulated examples, not actual human tests. Group and post-A4 evidence still pending." if ILLUSTRATIVE else "Pending: real user tests, post-A4 contributions, group number and exact A4 baseline.")
    c.drawRightString(WIDTH - MARGIN, 29, f"{slide_count} / 6")
    c.showPage()


begin("SmartBus Astana", "Project Integration, Testing and Improvement · Endterm")
add("Help a passenger choose a less crowded departure: select a route, stop and time, compare predictions, then save the preferred option.", label="User goal:")
add("A working HTML/CSS/JavaScript prototype using simulated demand rules. No live CTS data, physical sensors or trained machine-learning model.", label="Scope:")
add(TEAM, label="Team:")
add(GROUP, label="Group:")
add("Same project as Assignment 4. Technical baseline: 1c2b3a7. The team supplied amanalikhan9020.github.io/smart-bus-v2/ as its A4 website; the exact submitted commit is not confirmed.", small=True)
finish()

begin("Functional progress & connected scenario", "New functionality: compare three departure times and save the selected prediction.")
add("Before: one prediction. After: the selected time, +30 and +60 minutes, with occupancy, passenger counts and a recommendation. Equal predictions are reported honestly.")
add("Guest / login → route + stop + time → prediction → compare → select → save → Saved Trips → reload → retrieve the same choice.")
add("Inputs → shared calculation model → selected trip object → localStorage keyed by user ID → trip list and saved-data analytics.", label="Data flow:")
add("Crossing midnight is labelled ‘Next day’. These are simulated demand comparisons, not real bus departure schedules.", small=True)
add("The existing simulated route-demand chart remains a separate analysis. Not every page needs to be part of the same scenario.", small=True)
finish()

begin("Previous functionality: demonstrate live", "19 automated browser tests passed (33.690 s, exit 0). Automated tests are not human usability tests.")
table([
    ["Area", "Working demonstration"],
    ["Data storage", "Save and retrieve after reload; filter and delete saved trips."],
    ["Validation", "Reject empty/whitespace-only required input, name the field, prevent saving, then succeed after correction. Also check email format and duplicates."],
    ["Smart function", "Input → occupancy and passengers. Bus 10, first stop: 18:00 → 56%; 05:00 → 10%. The same model powers comparison."],
    ["Data analysis", "Average + maximum + a chart from saved predictions. Adding/deleting trips updates the results; empty data has a clear state."],
    ["Basic security", "HTML input stays inert; wrong passwords are blocked. Salted PBKDF2, account separation and legacy migration/recovery. Local protection only."],
], [145, BODY_WIDTH - 145])
finish()

begin("Illustrative usability results" if ILLUSTRATIVE else "User testing: two people outside the team",
      "Two simulated records for the same task. No real participants were tested." if ILLUSTRATIVE else "Both users must perform the same task in the working app; names and video are not required.")
add("T1: Continue as guest. Choose Bus 10, the first stop and 18:00. Compare three options, save the least crowded, find it after reload, then report the saved average and maximum occupancy.", small=True)
table([["User", "Task", "Completion result", "Difficulties / feedback"]] + USER_RESULTS,
      [95, 65, 235, BODY_WIDTH - 395])
add("These example outcomes describe possible usability problems; they are not observations collected from people." if ILLUSTRATIVE else "Record: completed independently / with help / not completed. Use the same app version and a fresh browser profile for each participant.", small=True)
add("To satisfy the assessment, give T1 to two people outside the team and replace these samples with their actual results." if ILLUSTRATIVE else "PENDING REAL TESTS. The previously supplied tester examples were explicitly illustrative; they are not recorded as actual results.", small=True)
finish()

if ILLUSTRATIVE:
    begin("Two implemented usability improvements", "Illustrative feedback → implemented audit improvement → technical verification.")
    table([
        ["Sample problem", "Before / after and technical verification"],
        ["1. Time selection was hard to find", "Before: a generic ‘Time’ label. After: ‘Departure time (required)’, an accented field and a clear missing-time error. Checked: visible on a 390px screen; changing 18:00 to 19:00 updates the prediction from 56% to 49%."],
        ["2. Occupancy meaning was unclear", "Before: percentage and level without numeric thresholds. After: passenger/capacity definition; low <45%, medium 45–74%, high ≥75%. Checked: explanation is visible; 05:00 gives 10%/Low, 18:00 gives 56%/Medium for Bus 10, first stop."],
    ], [190, BODY_WIDTH - 190])
    add("These changes are real and were found through code review. The sample feedback is simulated; no improvement in human task completion or understanding has been measured.", small=True)
    add("The 19 automated regression checks passed. Real feedback and a repeated affected task are still required to complete the user-testing criterion.", small=True)
else:
    begin("Two improvements based on real feedback", "Required evidence: problem → change → before / after → repeat the affected task.")
    for improvement in IMPROVEMENTS:
        add(improvement)
    add("The team may repeat the affected task; inviting the users again is not required. One functional improvement may satisfy both progress and feedback criteria when the evidence supports it.", small=True)
    add("Implemented audit fixes: Security now opens; Save Trip reports success and duplicate errors; required fields are identified; plaintext passwords were replaced. All 19 browser checks passed.", small=True)
    add("These audit fixes cannot yet be claimed as two user-testing improvements. Actual feedback and the follow-up verification results still need to be collected.", small=True)
finish()

begin("Limitations, next steps & team contributions", "Live presentation and demonstration: 8–10 minutes, followed by questions and functional checks.")
add("Simulated occupancy, no live CTS or guaranteed arrival times. Local data has no device sync or server authentication. The browser owner can edit storage; PBKDF2 does not encrypt localStorage.", small=True)
add("Confirm the A3–A4 baseline; run two real user tests; implement two feedback-based improvements and repeat the tasks. Before Final: evaluate the model, consider verified data sources and server-side storage/access checks.", small=True, label="Next steps:")
add(CONTRIBUTIONS, small=True, label="Contributions:")
add("Every member must understand the complete scenario, explain relevant code/formulas/tests and answer individually. Slides or speaking alone are not enough; AI is allowed when the team understands the implementation.", small=True)
add("Moodle: repository link OR source archive + final PDF (4–6 slides) + all names and group number. A separate report is not required. This draft still needs the missing evidence.", small=True)
finish()

assert slide_count == 6
c.save()
print(f"Generated {OUTPUT.name}: {slide_count} slides")
