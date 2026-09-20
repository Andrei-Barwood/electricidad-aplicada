#!/usr/bin/env python3
"""Chroma-key lime product shots + wood knockout for paper bills."""
from pathlib import Path
import numpy as np
from PIL import Image

RAW = Path("magia/assets/keyed_raw")
CROPS = Path("magia/assets/raw_crops")
OUT = Path("magia/assets/sprites")
OUT.mkdir(parents=True, exist_ok=True)


def erode_alpha(alpha: np.ndarray, n: int = 1) -> np.ndarray:
    a = alpha.copy()
    for _ in range(n):
        up = np.pad(a[1:, :], ((0, 1), (0, 0)), mode="edge")
        down = np.pad(a[:-1, :], ((1, 0), (0, 0)), mode="edge")
        left = np.pad(a[:, 1:], ((0, 0), (0, 1)), mode="edge")
        right = np.pad(a[:, :-1], ((0, 0), (1, 0)), mode="edge")
        a = np.minimum.reduce([a, up, down, left, right])
    return a


def key_lime(im: Image.Image, extra_shadow=False, tight=False) -> Image.Image:
    arr = np.asarray(im.convert("RGB")).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    # sample corners for the lime
    h, w = r.shape
    corners = np.stack([
        arr[2, 2], arr[2, w - 3], arr[h - 3, 2], arr[h - 3, w - 3],
        arr[2, w // 2], arr[h - 3, w // 2], arr[h // 2, 2], arr[h // 2, w - 3],
    ])
    cr, cg, cb = np.median(corners, axis=0)
    dist = np.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2)
    # neon chroma only — not olive Grimm's green or abacus beads
    neon = (g > 200) & (g > r + 60) & (g > b + 50) & (r < 150)
    dlim = 28 if tight else 42
    gmin = 195 if tight else 170
    bg = ((dist < dlim) & (g > gmin)) | neon
    # leftover lime shadow (cups) — green-dominant, not wood
    leftover = (g > 95) & (g > r + 28) & (g > b + 18) & (r < 130) & ((g - r) > 25)
    if extra_shadow:
        bg = bg | leftover
    alpha = np.where(bg, 0.0, 255.0)
    alpha = erode_alpha(alpha, 1)
    # despill
    mx = np.maximum(r, b)
    spill = np.clip(g - mx, 0, None)
    g2 = np.clip(g - spill * 0.7, 0, 255)
    rgba = np.dstack([r.astype(np.uint8), g2.astype(np.uint8), b.astype(np.uint8), alpha.astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    pad = 8
    canvas = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(out, (pad, pad), out)
    return canvas


def knockout_wood(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGB")).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    h, w = r.shape
    # wood is pale desaturated yellow-beige
    corners = np.stack([arr[4, 4], arr[4, w - 5], arr[h - 5, 4], arr[h - 5, w - 5]])
    cr, cg, cb = np.median(corners, axis=0)
    dist = np.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2)
    sat = np.max(arr, axis=2) - np.min(arr, axis=2)
    wood = (dist < 42) & (sat < 55)
    alpha = np.where(wood, 0.0, 255.0)
    alpha = erode_alpha(alpha, 1)
    rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    pad = 8
    canvas = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(out, (pad, pad), out)
    return canvas


def main():
    for src in sorted(RAW.glob("*.jpg")):
        tight = src.stem in ("rainbow", "abaco")
        png = key_lime(Image.open(src), extra_shadow=src.stem in ("cups", "silk-kilo"), tight=tight)
        png.save(OUT / (src.stem + ".png"))
        print("keyed", src.stem, png.size)

    # photographic scraps for the rest of the first-floor toys
    for name in ("bill-1", "bill-10", "bill-5", "bills", "scale", "register", "triangle",
                 "mousetrap", "passport", "glasses", "hat-bow", "kapla-stack",
                 "bowl-med", "bowl-small"):
        p = CROPS / f"{name}.jpg"
        if not p.exists():
            continue
        im = Image.open(p).convert("RGBA")
        w, h = im.size
        mask = Image.new("L", (w, h), 0)
        from PIL import ImageDraw
        d = ImageDraw.Draw(mask)
        d.rounded_rectangle((4, 4, w - 5, h - 5), radius=18, fill=255)
        im.putalpha(mask)
        im.save(OUT / f"{name}.png")
        print("scrap", name, im.size)

    # empty-wood patch for table fill
    mesa = Image.open("/Users/andreibarwood/Documents/Mega Doll/AiW/hayley/01 - gemini/src/mesa-t1.jpg")
    w, h = mesa.size
    # strip of empty tabletop under the toys
    patch = mesa.crop((int(0.18 * w), int(0.72 * h), int(0.55 * w), int(0.82 * h)))
    patch.save(OUT / "_wood_patch.jpg", quality=90)
    print("wood patch", patch.size)


if __name__ == "__main__":
    main()
