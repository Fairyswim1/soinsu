from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "number-break" / "effects" / "pop_vfx_sheet.png"
OUT_DIR = ROOT / "public" / "assets" / "number-break" / "effects" / "generated"


REGIONS = {
    "pop_burst": (55, 35, 455, 285),
    "shockwave": (500, 45, 1030, 275),
    "fragments": (1030, 45, 1480, 285),
    "stars": (55, 330, 470, 590),
    "impact_flash": (520, 300, 995, 610),
    "glowing_dots": (1030, 330, 1480, 585),
    "motion_streaks": (55, 650, 480, 875),
    "success_burst": (945, 665, 1515, 890),
}


def background_alpha(pixel: tuple[int, int, int, int]) -> int:
    r, g, b, source_alpha = pixel
    brightness = max(r, g, b)
    saturation = max(r, g, b) - min(r, g, b)

    if source_alpha == 0:
        return 0
    if brightness < 24:
        return 0
    if brightness < 64 and saturation < 34:
        return 0
    if brightness < 96 and saturation < 18:
        return 0

    alpha = int(min(255, max(0, (brightness - 20) * 2.5)))
    if saturation > 28:
        alpha = max(alpha, int(min(255, saturation * 3.1)))
    return min(source_alpha, alpha)


def trim_alpha(image: Image.Image, padding: int = 18) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def extract_effect(sheet: Image.Image, name: str, box: tuple[int, int, int, int]) -> None:
    crop = sheet.crop(box).convert("RGBA")
    out = Image.new("RGBA", crop.size, (255, 255, 255, 0))

    source = crop.load()
    dest = out.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = source[x, y]
            alpha = background_alpha((r, g, b, a))
            if alpha <= 0:
                continue
            # Keep luminous VFX color while converting the sheet backdrop to alpha.
            boost = 1.1
            dest[x, y] = (
                min(255, int(r * boost)),
                min(255, int(g * boost)),
                min(255, int(b * boost)),
                alpha,
            )

    final = trim_alpha(out)
    final.save(OUT_DIR / f"{name}.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGBA")
    for name, box in REGIONS.items():
        extract_effect(sheet, name, box)


if __name__ == "__main__":
    main()
