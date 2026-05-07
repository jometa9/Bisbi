#!/usr/bin/env python3
"""Generate the DMG installer background (cream + green Bisbi wordmark)."""
from urllib.request import urlretrieve
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "build-resources"
FONTS_DIR = OUT_DIR / "fonts"
W, H = 540, 380
CREAM = "#F0EDE6"
GREEN = "#5A8C83"

FONT_DISPLAY = FONTS_DIR / "PlusJakartaSans.ttf"
FONT_BODY = FONTS_DIR / "DMSans.ttf"

FONT_SOURCES = {
    FONT_DISPLAY: "https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf",
    FONT_BODY: "https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf",
}


def ensure_fonts() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    for path, url in FONT_SOURCES.items():
        if path.exists():
            continue
        print(f"downloading {path.name}…")
        urlretrieve(url, path)


def load(path: Path, size: int, weight: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(path), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def render(scale: int, path: Path) -> None:
    w, h = W * scale, H * scale
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img)

    title = load(FONT_DISPLAY, 72 * scale, 700)

    tw = d.textlength("Bisbi", font=title)
    bbox = title.getbbox("Bisbi")
    d.text(((w - tw) / 2, 120 * scale - bbox[1]), "Bisbi", font=title, fill=GREEN)

    img.save(path, "PNG")
    print(f"wrote {path} ({w}x{h})")


if __name__ == "__main__":
    ensure_fonts()
    render(1, OUT_DIR / "dmg-background.png")
    render(2, OUT_DIR / "dmg-background@2x.png")
