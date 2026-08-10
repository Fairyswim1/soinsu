from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "assets" / "number-break" / "tiles"
OUT_DIR = SOURCE_DIR / "generated"


def tile_alpha(pixel: tuple[int, int, int, int]) -> int:
    r, g, b, source_alpha = pixel
    brightness = max(r, g, b)
    saturation = max(r, g, b) - min(r, g, b)

    if source_alpha == 0:
        return 0
    if brightness < 18:
        return 0

    # Remove the dark presentation backdrop, but keep saturated tile rims and bright numbers.
    if saturation < 18 and brightness < 155:
        return 0
    if saturation < 10 and brightness < 205:
        return 0

    alpha_from_brightness = max(0, min(255, int((brightness - 32) * 1.65)))
    alpha_from_saturation = max(0, min(255, int((saturation - 14) * 3.4)))
    alpha = max(alpha_from_brightness, alpha_from_saturation)

    if brightness > 215:
        alpha = max(alpha, 240)
    return min(source_alpha, alpha)


def trim_alpha(image: Image.Image, padding: int = 36) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if bbox is None:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def process_tile(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    out = Image.new("RGBA", image.size, (255, 255, 255, 0))
    source = image.load()
    dest = out.load()

    for y in range(image.height):
      for x in range(image.width):
        r, g, b, a = source[x, y]
        alpha = tile_alpha((r, g, b, a))
        if alpha <= 0:
            continue
        dest[x, y] = (r, g, b, alpha)

    trimmed = trim_alpha(out)
    trimmed.save(OUT_DIR / path.name)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for path in sorted(SOURCE_DIR.glob("prime_*.png")):
        process_tile(path)


if __name__ == "__main__":
    main()
