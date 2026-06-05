from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os

W, H = A4
MARGIN = 22 * mm

# Palette
BG     = colors.HexColor("#FAFAF8")
INK    = colors.HexColor("#1A1A1A")
MUTED  = colors.HexColor("#6B6B6B")
ACCENT = colors.HexColor("#D4492A")  # warm red-orange
RULE   = colors.HexColor("#E0DDD8")
BAND   = colors.HexColor("#F4F2EE")

HERE = os.path.dirname(os.path.abspath(__file__))
MAP_PATH = os.path.join(HERE, "japan_map.png")


def draw(c):
    # Background
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
    rows = [
        ("1", "Osaka",  "Day trips: Nara, Hiroshima", "5", "16–20 Nov"),
        ("2", "Tokyo",  "City, culture, food",        "5", "21–25 Nov"),
        ("3", "Hakuba", "Skiing",                      "3", "26–28 Nov"),
        ("4", "Hakone", "Mt. Fuji views",              "2", "29–30 Nov"),
        ("5", "Kyoto",  "Temples",                     "5", "1–5 Dec"),
        ("6", "Osaka",  "Return · fly home (KIX)",    "2", "6–7 Dec"),
    ]

    col_x = x
    col_w = map_x - MARGIN - 12 * mm
    days_x = col_x + col_w
    date_x = days_x - 18 * mm   # date column sits left of the days count
    row_h = 11.5 * mm
    ry = body_top

    for i, (num, dest, note, days, dates) in enumerate(rows):
        cell_top = ry
        cell_bottom = ry - row_h

        if i % 2 == 0:
            c.setFillColor(BAND)
            c.rect(col_x - 3 * mm, cell_bottom, col_w + 3 * mm, row_h,
                   fill=1, stroke=0)

        # order number (accent)
        c.setFillColor(ACCENT)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(col_x, cell_top - 5.5 * mm, num)

        # destination
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(col_x + 7 * mm, cell_top - 5.5 * mm, dest)

        # note
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8.5)
        c.drawString(col_x + 7 * mm, cell_top - 10 * mm, note)

        # date range (right-aligned, muted)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawRightString(date_x - 3 * mm, cell_top - 5.5 * mm, dates)

        # days count (right aligned)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(days_x, cell_top - 5.5 * mm, days)
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

    # ── Footer note ─────────────────────────────────────────────────
    fy = min(ry, map_y) - 12 * mm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, fy + 4 * mm, W - MARGIN, fy + 4 * mm)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(x, fy - 1 * mm,
                 "Fly in & out of Kansai Airport (KIX)  ·  Osaka is 15 min from KIX by train.")

    c.setFont("Helvetica", 7)
    c.drawRightString(W - MARGIN, 12 * mm, "1")


out = os.path.join(HERE, "japan_trip.pdf")
c = canvas.Canvas(out, pagesize=A4)
c.setTitle("Japan Trip — 22 Days")
c.setAuthor("Self Dashboard")
draw(c)
c.save()
print(f"PDF saved: {out}")
