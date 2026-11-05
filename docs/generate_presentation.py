"""Build the six-slide Endterm draft. Requires reportlab and DejaVu Sans.

Fill only verified human/team evidence below, then review ENDTERM.md and rebuild.
This generator deliberately does not fabricate test outcomes or contributions.
"""
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "endterm-draft.pdf"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DV", str(FONT_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DVB", str(FONT_DIR / "DejaVuSans-Bold.ttf")))

# Replace placeholders with confirmed facts; do not infer them from AI changes.
TEAM = "Amangeldi Alikhan · Kerimbayev Akarys · Kartbay Alim"
GROUP = "[номер группы — заполнить]"
CONTRIBUTIONS = "A4 (данные пользователя): Alikhan 33,3% — логика/прогноз; Akarys 33,3% — UI/диаграммы; Alim 33,4% — защита/тесты. Вклад каждого ПОСЛЕ A4 — [подтвердить]."
USER_RESULTS = [
    ["User 1", "T1", "[не предоставлен]", "[затруднения и feedback]"],
    ["User 2", "T1", "[не предоставлен]", "[затруднения и feedback]"],
]
IMPROVEMENTS = [
    "1. [реальный отзыв] → [изменение] → [до/после] → [повтор задачи и результат]",
    "2. [реальный отзыв] → [изменение] → [до/после] → [повтор задачи и результат]",
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
c.setTitle("SmartBus Astana — Endterm, черновик")
c.setAuthor("SmartBus project — team details awaiting confirmation")
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
    c.drawRightString(WIDTH - MARGIN, HEIGHT - 40, "ЧЕРНОВИК — НЕ ГОТОВ К СДАЧЕ")
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
    c.drawString(MARGIN, 29, "Нет подтверждённых данных двух пользователей, вклада команды и версии A4.")
    c.drawRightString(WIDTH - MARGIN, 29, f"{slide_count} / 6")
    c.showPage()


begin("Выбрать поездку до часа пик", "Учебный прототип прогнозирования загруженности автобусов Астаны.")
add("Пассажир выбирает маршрут, остановку и время, сравнивает прогнозы и сохраняет подходящий вариант.", label="Польза:")
add("Правила симулированного спроса. Нет live CTS, физического датчика или обученной ML-модели.", label="Данные:")
add(TEAM, label="Команда:")
add(GROUP, label="Группа:")
add("Тот же SmartBus; исходная техническая точка — 1c2b3a7. Сайт A4 указан пользователем: amanalikhan9020.github.io/smart-bus-v2/. Точный коммит сдачи не подтверждён.", small=True)
finish()

begin("Функциональный прогресс и сценарий", "Новое: сравнение трёх временных вариантов и сохранение выбранного.")
add("До: один прогноз. Теперь: исходное время, +30 и +60 минут; загрузка, пассажиры, рекомендация. Равные прогнозы показываются честно.")
add("Гость/вход → маршрут + остановка + время → прогноз → сравнение → выбор → сохранение → Saved Trips → reload → тот же выбор.")
add("Ввод → общая функция расчёта → выбранный объект поездки → localStorage по user.id → список и аналитика.", label="Обмен данными:")
add("Переход через полночь отмечает следующий день. Это моменты расчёта спроса, не расписание реальных автобусов.", small=True)
add("Отдельная аналитика симулированного профиля маршрута сохранена. Не каждая страница входит в общий сценарий.", small=True)
finish()

begin("Предыдущие функции: показать вживую", "19 браузерных тестов пройдены (33,690 с, exit 0). Это не тесты двух реальных людей.")
table([
    ["Область", "Что продемонстрировать"],
    ["Хранение", "Сохранить → получить после reload; фильтр и удаление."],
    ["Валидация", "Пусто/пробелы: конкретное поле, нет записи, исправить и повторить. Второе правило: email/дубликат."],
    ["Умная функция", "Ввод → occupancy и пассажиры. Bus 10, первая остановка: 18:00 → 56%, 05:00 → 10%."],
    ["Аналитика", "Среднее + максимум + диаграмма сохранённых прогнозов; добавление/удаление меняет результаты."],
    ["Защита", "HTML остаётся текстом; неверный пароль отклоняется. PBKDF2/соль, миграция старых аккаунтов."],
], [160, BODY_WIDTH - 160])
finish()

begin("Тестирование: два человека вне команды", "Один и тот же T1 в работающем приложении; имена и видео не обязательны.")
add("T1: как гость выбрать Bus 10, первую остановку и 18:00; сравнить три варианта, сохранить наименее загруженный, найти после reload и назвать среднее/максимум в аналитике.", small=True)
table([["Пользователь", "Задание", "Результат", "Трудности / feedback"]] + USER_RESULTS,
      [115, 75, 210, BODY_WIDTH - 400])
add("Результат: самостоятельно / с помощью / не выполнено. Для обоих — одна версия и отдельный чистый профиль.", small=True)
add("ОЖИДАЕТ РЕАЛЬНОГО ТЕСТИРОВАНИЯ. Автотесты не заменяют людей; результаты не выдуманы.", small=True)
finish()

begin("Два улучшения по реальному feedback", "Обе карточки пока не заполнены: сначала тесты, затем изменения и повтор.")
for improvement in IMPROVEMENTS:
    add(improvement)
add("Повторить затронутую задачу может команда; приглашать участников заново не обязательно.", small=True)
add("Аудит выявил: неработающую Security, молчаливый Save Trip, слабые required-сообщения, открытые пароли. Их исправления проверяются отдельно.", small=True)
add("Эти исправления нельзя автоматически считать двумя улучшениями по пользовательскому тестированию. Нужны реальные отзывы и результат повторной проверки.", small=True)
finish()

begin("Ограничения, дальнейшие шаги и вклад", "Демонстрация — 8–10 минут, затем вопросы и функциональные проверки.")
add("Симуляция вместо live CTS. Локальное хранилище без синхронизации и серверной авторизации; владелец браузера может менять данные. PBKDF2 не шифрует localStorage.", small=True)
add("Подтвердить A3–A4; провести два теста; реализовать два изменения по feedback и повторить задачи; заполнить вклад и пересобрать PDF. До Final — уточнение модели и источников данных.", small=True, label="Дальше:")
add(CONTRIBUTIONS, small=True, label="Вклад:")
add("Каждый понимает весь сценарий и объясняет свой код, формулы и тесты. Одних слайдов/выступления недостаточно; AI допустим при понимании реализации.", small=True)
add("Для Moodle: ссылка на репозиторий ИЛИ архив кода + финальный PDF 4–6 слайдов + все имена и группа. Отдельный отчёт не обязателен.", small=True)
finish()

assert slide_count == 6
c.save()
print(f"Generated {OUTPUT.name}: {slide_count} slides")
