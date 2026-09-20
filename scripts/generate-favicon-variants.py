#!/usr/bin/env python3
"""Build light/dark favicon variants from public/images/assetgriffin-logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'images'
SRC = ROOT / 'assetgriffin-logo.png'


def build_light_variant(pixels: np.ndarray) -> np.ndarray:
    light_bg = np.array([247, 247, 244], dtype=np.float32)
    dark_teal = np.array([28, 110, 98], dtype=np.float32)
    lum = 0.299 * pixels[:, :, 0] + 0.587 * pixels[:, :, 1] + 0.114 * pixels[:, :, 2]
    light = np.zeros_like(pixels)
    is_fg = lum > 95
    light[~is_fg] = light_bg
    for channel in range(3):
        fg = pixels[:, :, channel][is_fg]
        if fg.size == 0:
            continue
        fg_min = float(fg.min())
        fg_max = float(max(fg.max(), fg_min + 1))
        normalized = (fg - fg_min) / (fg_max - fg_min)
        light[:, :, channel][is_fg] = dark_teal[channel] * (0.72 + 0.28 * normalized)
    return light.astype(np.uint8)


def write_sizes(path: Path) -> None:
    image = Image.open(path).convert('RGB')
    stem = path.stem
    image.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / f'{stem}-32.png')
    image.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / f'{stem}-180.png')


def main() -> None:
    source = Image.open(SRC).convert('RGB')
    pixels = np.array(source, dtype=np.float32)

    light_path = ROOT / 'assetgriffin-logo-light.png'
    dark_path = ROOT / 'assetgriffin-logo-dark.png'

    Image.fromarray(build_light_variant(pixels)).save(light_path)
    source.save(dark_path)

    for path in (SRC, light_path, dark_path):
        write_sizes(path)

    favicon = ROOT / 'assetgriffin-logo-dark-32.png'
    ico = Path(__file__).resolve().parents[1] / 'public' / 'favicon.ico'
    Image.open(favicon).save(ico, format='ICO', sizes=[(32, 32)])

    print(f'Generated favicon variants in {ROOT}')


if __name__ == '__main__':
    main()
