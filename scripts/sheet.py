"""Tile still frames into one contact sheet for a quick look.
Usage: python3 scripts/sheet.py out/sheet.jpg <cols> <image> [<image> ...]"""
import sys
from PIL import Image, ImageDraw

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tiles = [Image.open(f).convert("RGB") for f in files]
w, h = tiles[0].size
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
for i, (tile, name) in enumerate(zip(tiles, files)):
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(tile, (x, y))
    ImageDraw.Draw(sheet).text((x + 8, y + 6), name.split("t-")[-1].replace(".jpg", "s"), fill=(255, 220, 0))
sheet.save(out, quality=85)
