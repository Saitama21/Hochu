#!/usr/bin/env python3
"""Generate platform PWA icons from the approved raster icon.
No vector substitutes or external images: only local WebP input.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/icons/wishlist-icon.webp"
DEST = SOURCE.parent
with Image.open(SOURCE) as file:
    source = file.convert("RGB")
    for name, size in [
        ("favicon-32.png", 32),
        ("favicon-64.png", 64),
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("icon-1024.png", 1024),
        ("apple-touch-icon.png", 180),
    ]:
        source.resize((size, size), Image.Resampling.LANCZOS).save(
            DEST / name, "PNG", optimize=True
        )
        print(f"{name}: {size}×{size}")
