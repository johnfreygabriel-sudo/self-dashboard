"""Generate a clean, stylized map of Japan with the trip route plotted on it."""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from matplotlib.path import Path
import matplotlib.patheffects as pe

# ── Palette (matches the PDF) ──────────────────────────────────────
BG     = "#FAFAF8"
LAND   = "#E7E2D9"
COAST  = "#C9C2B5"
INK    = "#1A1A1A"
MUTED  = "#6B6B6B"
ACCENT = "#D4492A"

# ── Simplified island outlines (lon, lat) ──────────────────────────
HONSHU = [
    (131.0, 34.0), (132.5, 33.6), (133.6, 34.2), (135.0, 33.5),
    (136.0, 34.2), (136.9, 34.5), (137.5, 34.6), (138.6, 34.6),
    (139.8, 34.9), (140.9, 35.6), (141.0, 36.5), (141.0, 37.5),
    (141.5, 38.3), (141.6, 39.5), (141.9, 40.5), (141.4, 41.4),
    (140.5, 41.2), (140.0, 40.0), (139.9, 38.9), (139.0, 37.6),
    (138.3, 37.2), (137.4, 37.4), (136.7, 37.3), (136.0, 36.2),
    (135.5, 35.6), (135.0, 35.7), (134.0, 35.6), (133.0, 35.5),
    (132.0, 35.0), (131.5, 34.7), (131.0, 34.4),
]
HOKKAIDO = [
    (140.5, 42.0), (140.0, 42.6), (140.3, 43.3), (141.0, 43.2),
    (141.5, 43.8), (141.6, 44.3), (142.5, 44.3), (143.5, 44.3),
    (144.5, 44.0), (145.3, 43.7), (145.0, 43.3), (144.4, 43.0),
    (144.0, 42.9), (143.2, 42.3), (142.0, 42.6), (141.6, 42.5),
    (141.0, 42.0),
]
KYUSHU = [
    (130.9, 33.9), (130.3, 33.6), (129.8, 33.0), (129.6, 32.6),
    (130.0, 32.2), (130.2, 31.5), (130.6, 31.0), (131.0, 31.5),
    (131.5, 32.0), (131.8, 32.8), (131.7, 33.3), (131.4, 33.6),
]
SHIKOKU = [
    (132.5, 33.9), (132.7, 33.3), (133.3, 33.2), (134.2, 33.5),
    (134.7, 33.8), (134.3, 34.2), (133.5, 34.3), (132.8, 34.2),
]

ISLANDS = [HONSHU, HOKKAIDO, KYUSHU, SHIKOKU]

# ── Route cities (lon, lat) in order ───────────────────────────────
ROUTE = [
    ("Osaka",  135.50, 34.69, "below"),
    ("Tokyo",  139.69, 35.68, "right"),
    ("Hakuba", 137.86, 36.70, "above"),
    ("Hakone", 139.02, 35.23, "below"),
    ("Kyoto",  135.77, 35.01, "left"),
]
# Return leg ends back at Osaka
OSAKA_LON, OSAKA_LAT = 135.50, 34.69

fig, ax = plt.subplots(figsize=(6, 6.4), dpi=300)
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

# Land
for poly in ISLANDS:
    ax.add_patch(Polygon(poly, closed=True, facecolor=LAND,
                         edgecolor=COAST, linewidth=1.1,
                         joinstyle="round", zorder=1))

# Route line (dashed accent) — includes return leg to Osaka
rx = [c[1] for c in ROUTE] + [OSAKA_LON]
ry = [c[2] for c in ROUTE] + [OSAKA_LAT]
ax.plot(rx, ry, color=ACCENT, linewidth=1.8, linestyle=(0, (4, 3)),
        zorder=3, solid_capstyle="round")

# City dots + labels
offsets = {
    "above": (0, 0.32, "center", "bottom"),
    "below": (0, -0.34, "center", "top"),
    "right": (0.28, 0, "left", "center"),
    "left":  (-0.28, 0, "right", "center"),
}
for i, (name, lon, lat, pos) in enumerate(ROUTE):
    first = i == 0
    ax.scatter([lon], [lat], s=70 if first else 48,
               color=ACCENT if first else INK,
               edgecolors=BG, linewidths=1.2, zorder=4)
    dx, dy, ha, va = offsets[pos]
    txt = ax.text(lon + dx, lat + dy, name, fontsize=11,
                  color=INK, ha=ha, va=va, zorder=5,
                  fontweight="bold" if first else "normal")
    txt.set_path_effects([pe.withStroke(linewidth=2.5, foreground=BG)])

# "JAPAN" faint label in the sea
ax.text(133.0, 40.5, "JAPAN", fontsize=15, color=MUTED, alpha=0.45,
        ha="center", va="center", fontweight="bold",
        fontfamily="sans-serif").set_in_layout(False)

# Framing
ax.set_xlim(128.5, 146.5)
ax.set_ylim(30.0, 45.8)
ax.set_aspect(1.0 / math.cos(math.radians(37)))
ax.axis("off")

plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
out = "/home/user/self-dashboard/japan_map.png"
fig.savefig(out, dpi=300, facecolor=BG, bbox_inches="tight", pad_inches=0.1)
print(f"Map saved: {out}")
