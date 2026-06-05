from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

W, H = A4
MARGIN = 22 * mm

# Palette
BG     = colors.HexColor("#FAFAF8")
INK    = colors.HexColor("#1A1A1A")
MUTED  = colors.HexColor("#6B6B6B")
ACCENT = colors.HexColor("#D4492A")  # warm red-orange
RULE   = colors.HexColor("#E0DDD8")

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
    c.drawString(x, y, "20-day itinerary  ·  Osaka → Tokyo → Hakuba → Hakone → Kyoto")

    # thin rule
    y -= 5 * mm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, y, W - MARGIN, y)

    # ── Route visual ────────────────────────────────────────────────
    y -= 10 * mm
    stops = ["Osaka", "Tokyo", "Hakuba", "Hakone", "Kyoto"]
    col_w = (W - 2 * MARGIN) / (len(stops) * 2 - 1)

    dot_y = y
    dot_r = 3

    for i, stop in enumerate(stops):
        cx = x + (2 * i) * col_w + col_w / 2

        # dot
        c.setFillColor(ACCENT if i == 0 else INK)
        c.circle(cx, dot_y, dot_r, fill=1, stroke=0)

        # connecting line
        if i < len(stops) - 1:
            c.setStrokeColor(RULE)
            c.setLineWidth(1)
            c.line(cx + dot_r, dot_y, cx + 2 * col_w - dot_r, dot_y)

        # label
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 8)
        lw = c.stringWidth(stop, "Helvetica-Bold" if i == 0 else "Helvetica", 8)
        c.drawString(cx - lw / 2, dot_y - 5 * mm, stop)

    # ── Table ───────────────────────────────────────────────────────
    rows = [
        ("Osaka",  "Day trips to Nara, Hiroshima",  "5 days"),
        ("Tokyo",  "City, culture, food",            "5 days"),
        ("Hakuba", "Skiing",                          "3 days"),
        ("Hakone", "Mt. Fuji views",                  "2 days"),
        ("Kyoto",  "Temples & fly home (Kansai)",     "5 days"),
    ]

    y -= 18 * mm
    col1 = x
    col2 = x + 38 * mm
    col3 = W - MARGIN - 18 * mm
    row_h = 11 * mm

    # Header row
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(col1, y, "DESTINATION")
    c.drawString(col2, y, "HIGHLIGHTS")
    c.drawString(col3, y, "DAYS")

    y -= 3 * mm
    c.setStrokeColor(INK)
    c.setLineWidth(0.75)
    c.line(x, y, W - MARGIN, y)

    for i, (dest, note, days) in enumerate(rows):
        y -= row_h

        # subtle alternating band
        if i % 2 == 0:
            c.setFillColor(colors.HexColor("#F4F2EE"))
            c.rect(x - 2, y - 2, W - 2 * MARGIN + 4, row_h, fill=1, stroke=0)

        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col1, y + 2 * mm, dest)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(col2, y + 2 * mm, note)

        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col3, y + 2 * mm, days)

    # Total row
    y -= 3 * mm
    c.setStrokeColor(INK)
    c.setLineWidth(0.75)
    c.line(x, y, W - MARGIN, y)
    y -= 8 * mm

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(col1, y, "Total")
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(col3, y, "20 days")

    # ── Footer note ─────────────────────────────────────────────────
    y -= 14 * mm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.line(x, y + 4 * mm, W - MARGIN, y + 4 * mm)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(x, y - 1 * mm, "Fly in & out of Kansai Airport (KIX)  ·  Kansai is 15 min from Kyoto by train")

    # page number
    c.setFont("Helvetica", 7)
    c.drawRightString(W - MARGIN, 12 * mm, "1")


out = "/home/user/self-dashboard/japan_trip.pdf"
c = canvas.Canvas(out, pagesize=A4)
c.setTitle("Japan Trip — 20 Days")
c.setAuthor("Self Dashboard")
draw(c)
c.save()
print(f"PDF saved: {out}")
