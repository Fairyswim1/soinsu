from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets" / "number-break"


def trim_alpha(image: Image.Image, padding: int = 12) -> Image.Image:
    if image.mode != "RGBA":
        return image
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


def save_resized(source: Path, dest: Path, size: tuple[int, int], sharpen: bool = True, trim: bool = False) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGBA")
    if trim:
        image = trim_alpha(image)
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (255, 255, 255, 0))
    x = (size[0] - image.width) // 2
    y = (size[1] - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    if sharpen:
        canvas = canvas.filter(ImageFilter.UnsharpMask(radius=0.7, percent=130, threshold=3))
    canvas.save(dest)


def save_cover(source: Path, dest: Path, size: tuple[int, int]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGB")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    cropped = resized.crop((left, top, left + size[0], top + size[1]))
    cropped = cropped.filter(ImageFilter.UnsharpMask(radius=0.8, percent=115, threshold=4))
    cropped.save(dest)


def main() -> None:
    runtime = ASSET_ROOT / "runtime"
    save_cover(ASSET_ROOT / "background" / "gameplay_bg.png", runtime / "background_1280x720.png", (1280, 720))

    for name in ("fullscreen_button", "hint_button", "pause_button"):
        save_resized(ASSET_ROOT / "buttons" / f"{name}.png", runtime / "ui" / f"{name}_118x78.png", (236, 156), trim=True)

    for name in ("start_button", "howto_button"):
        save_resized(ASSET_ROOT / "buttons" / f"{name}.png", runtime / "ui" / f"{name}.png", (620, 240), trim=True)

    for name in ("small_chip", "medium_chip", "long_chip", "mission_chip"):
        source = ASSET_ROOT / "hud" / "generated" / f"{name}.png"
        if name == "small_chip":
            size = (264, 88)
        elif name == "medium_chip":
            size = (356, 116)
        elif name == "long_chip":
            size = (440, 92)
        else:
            size = (520, 104)
        save_resized(source, runtime / "ui" / f"{name}.png", size)

    for source in sorted((ASSET_ROOT / "tiles" / "generated").glob("prime_*.png")):
        save_resized(source, runtime / "tiles" / source.name, (176, 176), sharpen=True)


if __name__ == "__main__":
    main()
