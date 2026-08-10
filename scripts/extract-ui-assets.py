from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
UI_DIR = ROOT / "public" / "assets" / "number-break" / "hud"
OUT_DIR = UI_DIR / "generated"


HUD_CROPS = {
    "moves_card": (70, 310, 500, 600),
    "time_card": (540, 305, 1000, 600),
    "score_card": (1010, 310, 1475, 600),
}

CHIP_CROPS = {
    "small_chip": (145, 185, 410, 300),
    "medium_chip": (500, 178, 900, 305),
    "long_chip": (965, 175, 1405, 305),
    "mission_chip": (520, 430, 1175, 585),
}


def backdrop_alpha(pixel: tuple[int, int, int, int]) -> int:
    r, g, b, source_alpha = pixel
    brightness = max(r, g, b)
    saturation = max(r, g, b) - min(r, g, b)
    if source_alpha == 0:
        return 0
    if saturation < 18 and brightness < 185:
        return 0
    return source_alpha


def remove_sheet_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    out = Image.new("RGBA", image.size, (255, 255, 255, 0))
    source = image.load()
    dest = out.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = source[x, y]
            alpha = backdrop_alpha((r, g, b, a))
            if alpha <= 0:
                continue
            dest[x, y] = (r, g, b, alpha)
    return out


def trim_alpha(image: Image.Image, padding: int = 10) -> Image.Image:
    bbox = image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        return image
    left, top, right, bottom = bbox
    return image.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(image.width, right + padding),
            min(image.height, bottom + padding),
        )
    )


def clear_hud_text(card: Image.Image) -> Image.Image:
    card = card.convert("RGBA")
    overlay = Image.new("RGBA", card.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = card.size
    # Cover baked label/value text with clean navy panels while preserving the outer chrome.
    draw.rounded_rectangle((w * 0.14, h * 0.18, w * 0.86, h * 0.44), radius=22, fill=(17, 31, 82, 255))
    draw.rounded_rectangle((w * 0.11, h * 0.42, w * 0.89, h * 0.8), radius=30, fill=(8, 16, 56, 255))
    overlay = overlay.filter(ImageFilter.GaussianBlur(0.15))
    return Image.alpha_composite(card, overlay)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    hud_sheet = Image.open(UI_DIR / "hud_cards_sheet.png").convert("RGBA")
    for name, box in HUD_CROPS.items():
        card = remove_sheet_background(hud_sheet.crop(box))
        card = trim_alpha(card, 8)
        card = clear_hud_text(card)
        card.save(OUT_DIR / f"{name}.png")

    chip_sheet = Image.open(UI_DIR / "secondary_chips_sheet.png").convert("RGBA")
    for name, box in CHIP_CROPS.items():
        chip = remove_sheet_background(chip_sheet.crop(box))
        chip = trim_alpha(chip, 8)
        chip.save(OUT_DIR / f"{name}.png")


if __name__ == "__main__":
    main()
