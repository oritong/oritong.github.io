"""Generate the three new gallery copies locally; never overwrite source artwork.

Usage: python scripts/watermark-new-artworks.py SOURCE_DIRECTORY
Requires Pillow and a font supporting Chinese (default: Windows Microsoft YaHei Bold).
"""
import argparse
from math import ceil, hypot
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ARTWORKS = [
    ("立绘.png", "standing-portrait.png", "躺躺面条"),
    ("双人小框.jpg", "duo-illustration.jpg", "再哭奶粉罐给你打翻"),
    ("我在看着你…….png", "watching-you.png", "星星睡不着"),
]


def watermark(source, target, artist, font_path):
    with Image.open(source) as opened:
        base = ImageOps.exif_transpose(opened).convert("RGBA")
    font_size = max(34, min(64, round(base.width * 0.032)))
    font = ImageFont.truetype(str(font_path), font_size)
    label = f"约稿：哦里冻  画师：{artist}"
    bounds = font.getbbox(label)
    step_x = bounds[2] - bounds[0] + round(font_size * 0.45)
    step_y = round(font_size * 1.8)
    side = ceil(hypot(base.width, base.height) * 1.35)
    pattern = Image.new("RGBA", (side, side))
    painter = ImageDraw.Draw(pattern)
    for row, y in enumerate(range(-step_y, side + step_y, step_y)):
        offset = step_x // 2 if row % 2 else 0
        for x in range(-step_x + offset, side + step_x, step_x):
            painter.text((x - bounds[0], y - bounds[1]), label,
                         font=font, fill=(154, 158, 168, 132))
    rotated = pattern.rotate(30, resample=Image.Resampling.BICUBIC, expand=True)
    left = (rotated.width - base.width) // 2
    top = (rotated.height - base.height) // 2
    base.alpha_composite(rotated.crop((left, top, left + base.width, top + base.height)))
    if target.suffix.lower() == ".jpg":
        base.convert("RGB").save(target, quality=90, optimize=True, progressive=True)
    else:
        base.save(target, optimize=True, compress_level=9)
    print(f"{target.name}: {base.width}x{base.height}, {target.stat().st_size:,} bytes; {label}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output-directory", type=Path,
                        default=Path(__file__).resolve().parents[1] / "assets" / "gallery")
    parser.add_argument("--font", type=Path, default=Path("C:/Windows/Fonts/msyhbd.ttc"))
    args = parser.parse_args()
    # Validate everything before creating copies; input and output must be separate.
    if args.source_directory.resolve() == args.output_directory.resolve():
        parser.error("Keep original artwork outside the output directory.")
    for filename, _, _ in ARTWORKS:
        if not (args.source_directory / filename).is_file():
            parser.error(f"Missing original: {filename}")
    if not args.font.is_file():
        parser.error("Supply a Chinese-capable font with --font.")
    args.output_directory.mkdir(parents=True, exist_ok=True)
    for source, target, artist in ARTWORKS:
        watermark(args.source_directory / source, args.output_directory / target, artist, args.font)


if __name__ == "__main__":
    main()
