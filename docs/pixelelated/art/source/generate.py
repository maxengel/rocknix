#!/usr/bin/env python3
"""Regenerate the interim LCD wordmark assets; see ../wordmark-system.md.

Requires fonttools==4.66.1. The font is supplied explicitly, never downloaded.
Optional PNG proofs require cairosvg==2.9.1 and pillow==12.3.0.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
NS = 'http://www.w3.org/2000/svg'


def hex_color(rgb):
    if len(rgb) != 3 or any(type(c) is not int or not 0 <= c <= 31 for c in rgb):
        raise ValueError(f'invalid RGB555 triplet: {rgb}')
    return '#' + ''.join(f'{round(c * 255 / 31):02X}' for c in rgb)


def outlines(font_path, metadata):
    if hashlib.sha256(font_path.read_bytes()).hexdigest() != metadata['sha256']:
        raise ValueError('font hash differs from the approved Tiny5 Duo LCD source')
    font = TTFont(font_path)
    if font['name'].getDebugName(1) != metadata['family']:
        raise ValueError('expected the exact Tiny5 Duo LCD family')
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    unit = font['head'].unitsPerEm / 8
    cursor, contours = 0, []
    for char in 'pixelelated':
        name = cmap[ord(char)]
        pen = RecordingPen()
        glyphs[name].draw(pen)
        contour = []
        for operation, points in pen.value:
            if operation in ('moveTo', 'lineTo'):
                x, y = points[0]
                contour.append(((x + cursor) / unit, -y / unit))
            elif operation == 'closePath':
                contours.append(contour)
                contour = []
            else:
                raise ValueError(f'unsupported outline operation: {operation}')
        if contour:
            raise ValueError('unclosed glyph contour')
        cursor += font['hmtx'][name][0]
    xs = [x for contour in contours for x, y in contour]
    ys = [y for contour in contours for x, y in contour]
    left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)
    width = math.ceil((right - left + 6) / 2) * 2
    height = 12
    dx = (width - (right - left)) / 2 - left
    dy = (height - (bottom - top)) / 2 - top
    paths = [' '.join(f'{"M" if i == 0 else "L"}{x+dx:g} {y+dy:g}'
                      for i, (x, y) in enumerate(contour)) + ' Z'
             for contour in contours]
    return paths, (width, height), (left+dx, top+dy, right-left, bottom-top), (dx, dy)


def svg(geometry, size, bounds, palette, live=False, origin=None):
    width, height = size
    x, y, w, h = bounds
    if live:
        dx, dy = origin
        glyph = (f'<text x="{dx:g}" y="{dy:g}" font-family="Tiny5 Duo LCD" '
                 'font-size="8" font-kerning="none" font-variant-ligatures="none" '
                 'letter-spacing="0">pixelelated</text>')
    else:
        glyph = '\n'.join(f'<path d="{path}"/>' for path in geometry)
    colors = [hex_color(c) for c in palette['rgb555']]
    rects = []
    for i, color in enumerate(colors):
        if palette['direction'] == 'vertical':
            box = x+i*w/len(colors), y, w/len(colors), h
        else:
            box = x, y+i*h/len(colors), w, h/len(colors)*palette.get('coverage', 1)
        a, b, c, d = box
        rects.append(f'<rect x="{a:g}" y="{b:g}" width="{c:g}" height="{d:g}" fill="{color}"/>')
    return (f'<svg xmlns="{NS}" viewBox="0 0 {width} {height}" '
            f'width="{width*8}" height="{height*8}" role="img" aria-labelledby="title" '
            'shape-rendering="crispEdges">\n<title id="title">pixelelated</title>\n'
            '<desc>Tiny5 Duo LCD; hard RGB555 bands; transparent background and LCD cell gaps.</desc>\n'
            '<defs>\n<clipPath id="wordmark-clip" clipPathUnits="userSpaceOnUse">\n'
            f'<g id="wordmark">\n{glyph}\n</g>\n</clipPath>\n</defs>\n'
            '<g id="palette-bands" clip-path="url(#wordmark-clip)">\n' +
            '\n'.join(rects) + '\n</g>\n</svg>\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', required=True, type=Path)
    parser.add_argument('--check', action='store_true', help='compare generated vector/CSS files without writing')
    parser.add_argument('--raster', action='store_true', help='also generate PNG exports and contact sheets')
    args = parser.parse_args()
    if args.check and args.raster:
        parser.error('--check and --raster are separate operations')
    metadata = json.loads((ROOT/'source/font.json').read_text())
    palettes = json.loads((ROOT/'source/palettes.json').read_text())
    paths, size, bounds, origin = outlines(args.font, metadata)
    products = {f'wordmark/{name}.svg': svg(paths, size, bounds, p)
                for name, p in palettes.items()}
    products['source/pixelelated-live-text.svg'] = svg(
        paths, size, bounds, palettes['ocean'], live=True, origin=origin)
    css = ['/* Generated RGB555 equivalents. Load the exact Tiny5 Duo LCD face before use. */',
           '.pixelelated-wordmark { display: inline-block; font-family: "Tiny5 Duo LCD"; '
           'font-size: 64px; line-height: 1; font-kerning: none; font-variant-ligatures: none; '
           'letter-spacing: 0; text-transform: none; background-image: var(--logo-fill); '
           '-webkit-background-clip: text; background-clip: text; color: transparent; '
           '-webkit-text-fill-color: transparent; }']
    for name, p in palettes.items():
        colors = [hex_color(c) for c in p['rgb555']]
        stops = []
        step = 100 / len(colors)
        for i, color in enumerate(colors):
            end = (i+p.get('coverage', 1))*step
            stops.append(f'{color} {i*step:g}% {end:g}%')
            if p.get('coverage', 1) < 1:
                stops.append(f'transparent {end:g}% {(i+1)*step:g}%')
        direction = 'right' if p['direction'] == 'vertical' else 'bottom'
        css.append(f'.{name} {{ --logo-fill: linear-gradient(to {direction}, ' + ', '.join(stops) + '); }')
    products['source/wordmark.css'] = '\n'.join(css)+'\n'
    for relative, content in products.items():
        destination = ROOT/relative
        if args.check:
            if not destination.is_file() or destination.read_text() != content:
                raise SystemExit(f'DIFF: {relative}')
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(content)
    if args.raster:
        import io
        import cairosvg
        from PIL import Image, ImageDraw
        sheets = []
        for name in palettes:
            for scale in (1, 2, 4):
                dest = ROOT/f'raster/{scale}x/{name}.png'
                dest.parent.mkdir(parents=True, exist_ok=True)
                cairosvg.svg2png(bytestring=products[f'wordmark/{name}.svg'].encode(),
                                write_to=str(dest), scale=scale)
            mark = Image.open(ROOT/f'raster/1x/{name}.png').convert('RGBA')
            row = Image.new('RGB', (1024, 248), '#25282F')
            draw = ImageDraw.Draw(row)
            draw.text((16, 6), name, fill='white')
            for i, background in enumerate(('#FFFFFF', '#101418', '#808080', '#B50063')):
                panel = Image.new('RGBA', (496, 100), background)
                panel.alpha_composite(mark, (8, 2))
                row.paste(panel.convert('RGB'), (8+(i%2)*512, 26+(i//2)*110))
            sheets.append(row)
        proof = Image.new('RGB', (1024, 248*len(sheets)), '#25282F')
        for i, row in enumerate(sheets):
            proof.paste(row, (0, 248*i))
        (ROOT/'proofs').mkdir(exist_ok=True)
        proof.save(ROOT/'proofs/backgrounds.png')
        small = Image.new('RGB', (1024, 320), '#101418')
        draw = ImageDraw.Draw(small)
        for col, name in enumerate(('ocean', 'monochrome-light')):
            y = 8
            for em in (16, 24, 32, 64):
                draw.text((col*512+12, y), f'{name}, {em}px em', fill='white')
                data = cairosvg.svg2png(bytestring=products[f'wordmark/{name}.svg'].encode(), scale=em/64)
                mark = Image.open(io.BytesIO(data)).convert('RGBA')
                small.paste(mark, (col*512+12, y+18), mark)
                y += int(12*em/8)+26
        small.save(ROOT/'proofs/small-sizes.png')
        screen = Image.new('RGBA', (640, 480), '#000000')
        mark = Image.open(ROOT/'raster/1x/ocean.png').convert('RGBA')
        screen.alpha_composite(mark, ((640-mark.width)//2, (480-mark.height)//2))
        screen.convert('RGB').save(ROOT/'proofs/boot-shutdown-640x480.png')
    print(f'{"PASS: reproduced" if args.check else "Generated"} {len(products)} vector/CSS files; '
          f'{len(paths)} original LCD contours; exact font SHA256')


if __name__ == '__main__':
    main()
