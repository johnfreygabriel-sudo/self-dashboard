from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os
import calendar as cal_mod
from datetime import date, timedelta

W, H = A4
MARGIN = 22 * mm

# Palette
BG     = colors.HexColor("#FAFAF8")
INK    = colors.HexColor("#1A1A1A")
MUTED  = colors.HexColor("#6B6B6B")
ACCENT = colors.HexColor("#D4492A")
RULE   = colors.HexColor("#E0DDD8")
BAND   = colors.HexColor("#F4F2EE")

# One color per destination
STOP_COLORS = {
    "Osaka":  "#D4492A",
    "Tokyo":  "#2E7BC4",
    "Hakuba": "#3D9970",
    "Hakone": "#8B63C4",
    "Kyoto":  "#C47E2E",
}

# (start, end, city, note, days_label, date_label)
STOPS = [
    (date(2026, 11, 16), date(2026, 11, 20), "Osaka",  "Day trips: Nara, Hiroshima", "5", "16–20 Nov"),
    (date(2026, 11, 21), date(2026, 11, 25), "Tokyo",  "City, culture, food",        "5", "21–25 Nov"),
    (date(2026, 11, 26), date(2026, 11, 28), "Hakuba", "Skiing",                      "3", "26–28 Nov"),
    (date(2026, 11, 29), date(2026, 11, 30), "Hakone", "Mt. Fuji views",              "2", "29–30 Nov"),
    (date(2026, 12,  1), date(2026, 12,  5), "Kyoto",  "Temples",                     "5", "1–5 Dec"),
    (date(2026, 12,  6), date(2026, 12,  7), "Osaka",  "Return · fly home (KIX)",    "2", "6–7 Dec"),
]

def _build_date_map():
    d_map = {}
    for start, end, city, *_ in STOPS:
        d = start
        while d <= end:
            d_map[d] = city
            d += timedelta(days=1)
    return d_map

DATE_MAP = _build_date_map()

HERE = os.path.dirname(os.path.abspath(__file__))
MAP_PATH = os.path.join(HERE, "japan_map.png")


def draw_month_cal(c, x, y_top, year, month, cell_w=9.5 * mm, cell_h=7.5 * mm):
    DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x, y_top - 5.5 * mm, cal_mod.month_name[month].upper())
    y = y_top - 12 * mm

    for i, letter in enumerate(DAY_LETTERS):
        cx = x + i * cell_w + cell_w / 2
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawCentredString(cx, y - 4 * mm, letter)
    y -= cell_h

    for week in cal_mod.monthcalendar(year, month):
        for col, day in enumerate(week):
            if day == 0:
                continue
            d = date(year, month, day)
            cx = x + col * cell_w
            cy = y - cell_h

            city = DATE_MAP.get(d)
            if city:
                c.setFillColor(colors.HexColor(STOP_COLORS[city]))
                c.roundRect(cx + 1, cy + 1, cell_w - 2, cell_h - 2,
                            1.5 * mm, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 7.5)
            else:
                c.setFillColor(colors.HexColor("#BBBBBB"))
                c.setFont("Helvetica", 7)
            c.drawCentredString(cx + cell_w / 2, cy + 2.3 * mm, str(day))
        y -= cell_h


def draw(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    x = MARGIN
    y = H - MARGIN

    # ── Header ──────────────────────────────────────────────────────
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(x, y, "Japan")
    c.setFillColor(ACCENT)
    c.drawString(x + c.stringWidth("Japan", "Helvetica-Bold", 26) + 4, y, ".")

    y -= 7 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawString(x, y, "16 Nov – 7 Dec 2026  ·  Osaka → Tokyo → Hakuba → Hakone → Kyoto → Osaka")

    y -= 5 * mm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, y, W - MARGIN, y)

    body_top = y - 12 * mm

    # ── Right column: Japan map ─────────────────────────────────────
    map_w = 70 * mm
    img = ImageReader(MAP_PATH)
    iw, ih = img.getSize()
    map_h = map_w * ih / iw
    map_x = W - MARGIN - map_w
    map_y = body_top - map_h
    c.drawImage(img, map_x, map_y, width=map_w, height=map_h,
                mask="auto", preserveAspectRatio=True)

    # ── Left column: itinerary ──────────────────────────────────────
    col_x = x
    col_w = map_x - MARGIN - 12 * mm
    days_x = col_x + col_w
    date_x = days_x - 18 * mm
    row_h = 11.5 * mm
    ry = body_top

    for i, (_, _, city, note, days_lbl, date_lbl) in enumerate(STOPS):
        cell_top = ry
        cell_bot = ry - row_h

        if i % 2 == 0:
            c.setFillColor(BAND)
            c.rect(col_x - 3 * mm, cell_bot, col_w + 3 * mm, row_h, fill=1, stroke=0)

        # colored stop swatch (thin vertical bar)
        c.setFillColor(colors.HexColor(STOP_COLORS[city]))
        c.roundRect(col_x, cell_top - 8 * mm, 2.5 * mm, 5.5 * mm, 0.8 * mm, fill=1, stroke=0)

        # number
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(col_x + 4.5 * mm, cell_top - 5.5 * mm, str(i + 1))

        # city name
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(col_x + 11 * mm, cell_top - 5.5 * mm, city)

        # note
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8.5)
        c.drawString(col_x + 11 * mm, cell_top - 10 * mm, note)

        # date range
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawRightString(date_x - 3 * mm, cell_top - 5.5 * mm, date_lbl)

        # day count
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(days_x, cell_top - 5.5 * mm, days_lbl)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawRightString(days_x, cell_top - 9.5 * mm, "days")

        ry -= row_h

    # Total
    c.setStrokeColor(INK)
    c.setLineWidth(0.75)
    c.line(col_x, ry, days_x, ry)
    ry -= 8 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(col_x, ry, "Total")
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(days_x, ry, "22 days")

    # ── Calendar section ────────────────────────────────────────────
    CAL_TOP = 118 * mm

    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, CAL_TOP, W - MARGIN, CAL_TOP)

    # Legend (unique cities in route order)
    legend_y = CAL_TOP - 6 * mm
    legend_stops = [("Osaka", "#D4492A"), ("Tokyo", "#2E7BC4"),
                    ("Hakuba", "#3D9970"), ("Hakone", "#8B63C4"), ("Kyoto", "#C47E2E")]
    full_w = W - 2 * MARGIN
    item_w = full_w / len(legend_stops)
    swatch = 3.5 * mm

    for i, (city_name, color) in enumerate(legend_stops):
        lx = x + i * item_w
        c.setFillColor(colors.HexColor(color))
        c.roundRect(lx, legend_y - swatch, swatch, swatch, 0.8 * mm, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(lx + swatch + 2 * mm, legend_y - swatch + 1 * mm, city_name)

    # Two months side by side
    month_top = legend_y - 9 * mm
    cell_w = 9.5 * mm
    month_w = 7 * cell_w           # 66.5 mm
    half_w = full_w / 2            # 83 mm
    offset = (half_w - month_w) / 2

    draw_month_cal(c, x + offset,           month_top, 2026, 11, cell_w=cell_w)
    draw_month_cal(c, x + half_w + offset,  month_top, 2026, 12, cell_w=cell_w)

    # ── Footer ──────────────────────────────────────────────────────
    fy = MARGIN + 4 * mm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, fy + 5 * mm, W - MARGIN, fy + 5 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(x, fy,
                 "Fly in & out of Kansai Airport (KIX)  ·  Osaka is 15 min from KIX by train.")
    c.setFont("Helvetica", 7)
    c.drawRightString(W - MARGIN, fy, "1")


out = os.path.join(HERE, "japan_trip.pdf")
c = canvas.Canvas(out, pagesize=A4)
c.setTitle("Japan Trip — 22 Days")
c.setAuthor("Self Dashboard")
draw(c)
c.save()
print(f"PDF saved: {out}")
