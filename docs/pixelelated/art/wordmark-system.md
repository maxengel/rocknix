# pixelelated temporary wordmark system

**Status:** interim wordmark specification\
**Wordmark:** `pixelelated` (always lowercase)\
**Typeface:** **Tiny5 Duo LCD** — the exact LCD face, not plain Tiny5 Duo\
**Color system:** RGB555\
**Canonical format:** SVG\
**Default:** Ocean Bands

This system preserves the owner's October 4 specification, with their
explicit correction to Tiny5 Duo LCD. It supplies reusable lettering for
boot, shutdown, interface and future animation work. D-WORKFLOW-145/146,
[tracking issue #409](https://github.com/pixelelated/distribution/issues/409).
The temporary wordmark can evolve when a final custom logo is commissioned.

## 1. Construction

The wordmark remains real Tiny5 Duo LCD lettering. Treat the text as a stencil:

1. Render `pixelelated` with the exact Tiny5 Duo LCD face.
2. Preserve its dot/cell geometry, spacing and negative space.
3. Place a five-color RGB555 band or pattern layer behind the glyphs.
4. Clip that layer with the glyph shapes.
5. Leave everything outside the glyphs, including LCD cell gaps, transparent.
6. Keep an editable live-text master.
7. Distribute an outlined SVG copy so the font need not be installed.

The [official Tiny5 project](https://github.com/Gissio/font_Tiny5) describes
the five-pixel family, its bolder Duo member, and 8 CSS pixel / 6 pt size
increments. Our approved face is the static **Tiny5Duo-LCD.otf**, version
2.007, revision `f740beb653d6839fac1f8c794668ffcf22037342`, under SIL OFL 1.1.
[Font provenance](source/font.json) records the exact checksum. No plain-Duo,
Tiny5 or system monospace fallback qualifies as this wordmark.

## 2. RGB555 rule

Every channel is an integer from 0 to 31. Triplets are canonical; 8-bit hex
values are derived display equivalents:

```text
channel8 = round(channel5 × 255 / 31)
```

Canonical assets use hard boundaries with no interpolated colors. The SVG
contains literal colored rectangles clipped to the lettering. Browser
antialiasing at unsuitable scales can still create edge colors; the supplied
PNG exports use crisp edges and retain binary alpha. Do not add blur to make
five colors visible at a small size.

The original draft's hex examples had seven discrepant palette entries.
The tables, CSS and SVGs below follow the triplets: for example channel 29
becomes `EF`, 24 becomes `C5`, 7 becomes `3A`, and 3 becomes `19`. Ocean Bands,
Scanline, Dual Fade and both monochromes already matched the formula.

## 3. Six five-color treatments

All six are approved treatments. Each has exactly five colors. The source
of the values is [palettes.json](source/palettes.json); the following tables
show their computed equivalents.

### Ocean Bands

Default: five horizontal bands, pale cyan to deep blue.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (20,31,31) | #A5FFFF |
| 2 | (2,28,31) | #10E6FF |
| 3 | (2,20,31) | #10A5FF |
| 4 | (3,12,31) | #1963FF |
| 5 | (3,4,22) | #1921B5 |

### Neon Fade

Five horizontal bands: pink, magenta, violet, blue, cyan. The band layer is
continuous; only the font's own gaps are transparent.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (31,5,23) | #FF29BD |
| 2 | (28,2,27) | #E610DE |
| 3 | (20,5,31) | #A529FF |
| 4 | (7,15,31) | #3A7BFF |
| 5 | (2,28,31) | #10E6FF |

### Pixel Spectrum

Five horizontal bands spanning warm and cool colors.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (31,29,23) | #FFEFBD |
| 2 | (31,20,3) | #FFA519 |
| 3 | (31,5,23) | #FF29BD |
| 4 | (20,5,31) | #A529FF |
| 5 | (2,25,31) | #10CEFF |

### Scanline

Five horizontal colored rows with literal transparent gaps. Each color
occupies 16% of the glyph-height region, followed by a 4% gap, including
after the last row. These gaps are additional to the LCD face's cell gaps.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (12,31,23) | #63FFBD |
| 2 | (2,27,31) | #10DEFF |
| 3 | (3,15,31) | #197BFF |
| 4 | (17,8,31) | #8C42FF |
| 5 | (31,4,25) | #FF21CE |

### Dual Fade

The sole left-to-right treatment: five hard vertical zones, cyan, blue,
violet, magenta, pink. Useful in wide lockups.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (2,28,31) | #10E6FF |
| 2 | (5,17,31) | #298CFF |
| 3 | (16,8,31) | #8442FF |
| 4 | (27,5,27) | #DE29DE |
| 5 | (31,5,23) | #FF29BD |

### Sunrise

Warm horizontal treatment: cream, yellow, orange, coral, magenta.

| # | RGB555 | Hex |
| --- | --- | --- |
| 1 | (31,29,21) | #FFEFAD |
| 2 | (31,24,3) | #FFC519 |
| 3 | (31,15,2) | #FF7B10 |
| 4 | (31,7,8) | #FF3A42 |
| 5 | (29,3,22) | #EF19B5 |

## 4. Live HTML and CSS

Load the exact face intentionally before showing live lettering. Use an
outlined SVG if font loading cannot be guaranteed. The editable master
requires Tiny5 Duo LCD installed locally; it intentionally embeds no font.

```html
<span class="pixelelated-wordmark ocean">pixelelated</span>
```

```css
.pixelelated-wordmark {
  display: inline-block;
  font-family: "Tiny5 Duo LCD";
  font-size: 64px;
  line-height: 1;
  font-kerning: none;
  font-variant-ligatures: none;
  letter-spacing: 0;
  text-transform: none;
  background-image: var(--logo-fill);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.ocean {
  --logo-fill: linear-gradient(to bottom,
    #A5FFFF 0% 20%, #10E6FF 20% 40%, #10A5FF 40% 60%,
    #1963FF 60% 80%, #1921B5 80% 100%);
}
```

[wordmark.css](source/wordmark.css) supplies every treatment, including
Scanline's explicit transparent intervals. Duplicated boundaries are
intentional. CSS fills the element's line box; it is a convenient live-text
presentation, not a pixel-identical replacement for the canonical SVG's
glyph-bounded fill. Use the SVG for an exact shared boot/site/interface mark.

## 5. Canonical SVG

The [editable SVG](source/pixelelated-live-text.svg) retains live lettering.
The eight files under [wordmark/](wordmark/) are portable outlined copies.
They retain a named `wordmark` group inside a `clipPath`, a separate
`palette-bands` group, and an accessible title. There is no background
rectangle and no embedded font or raster image.

The viewBox is 60 × 12; nominal dimensions are 480 × 96 (64px font em).
The exact outlines and advance widths match the current monochrome LCD
wordmark, with 10 units of empty canvas removed from each vertical edge.
The geometry is unchanged. Palette bounds follow the **ink bounds** of the
glyphs, including the descender and dot, so the bands do not disappear into
canvas margins. All colors and contours remain independently editable.

## 6. Rectangle and clip construction

Each production mark uses five rectangles (one for monochrome), clipped
with actual LCD glyph paths. This avoids gradient interpolation. The
construction is equivalent to the supplied rectangle/mask design:

```svg
<defs>
  <clipPath id="wordmark-clip" clipPathUnits="userSpaceOnUse">
    <g id="wordmark"><!-- exact Tiny5 Duo LCD glyph paths --></g>
  </clipPath>
</defs>
<g id="palette-bands" clip-path="url(#wordmark-clip)">
  <!-- five literal rectangles, with RGB555-derived fills -->
</g>
```

Band boundaries remain hard. Scanline shortens each band to 80% of its
ordinary height. Dual Fade uses vertical zones covering the glyph width.
Never merge LCD cells or fill their negative space when exporting.

## 7. Asset architecture and regeneration

The project's existing `docs/pixelelated/art/` is the brand asset root:

```text
art/
├── wordmark-system.md
├── source/
│   ├── pixelelated-live-text.svg
│   ├── palettes.json
│   ├── font.json
│   ├── wordmark.css
│   └── generate.py
├── wordmark/
│   ├── ocean.svg
│   ├── neon.svg
│   ├── spectrum.svg
│   ├── scanline.svg
│   ├── dual.svg
│   ├── sunrise.svg
│   ├── monochrome-light.svg
│   └── monochrome-dark.svg
├── raster/{1x,2x,4x}/
└── proofs/
```

Do not add the font binary here. It is intentionally redistributed, with
its OFL and source provenance, in the splash software repository. The font
license remains separate from the project's artwork terms in `TRADEMARK.md`.

Run from the distribution checkout with the dependencies in an isolated
Python environment (`fonttools==4.66.1`, and for PNG exports
`cairosvg==2.9.1`, `pillow==12.3.0`):

```sh
python docs/pixelelated/art/source/generate.py --font /path/to/Tiny5Duo-LCD.otf --raster
python docs/pixelelated/art/source/generate.py --font /path/to/Tiny5Duo-LCD.otf --check
```

The generator rejects a different font checksum or family. Exports are
480 × 96, 960 × 192 and 1920 × 384; they are presentation scales, not new
canonical sources. Do not round-trip PNGs back into lettering.

## 8. Monochrome fallback

| Use | RGB555 | Hex |
| --- | --- | --- |
| Light mark on dark | (31,31,31) | #FFFFFF |
| Dark mark on light | (2,4,5) | #102129 |

Use monochrome when contrast is insufficient, printing uses one color,
the mark is extremely small, or the renderer cannot reproduce the color
treatment. Choose the light or dark version for the actual background.
UI state must never depend on the wordmark's color.

## 9. Small-size behavior

The owner's suggested ranges refer to **font em size**, not canvas height:

| Size | Treatment |
| --- | --- |
| 64px+ | Full five-color treatment; review LCD gaps at the final size |
| 32–63px | Five colors only when discrete bands remain readable |
| 16–31px | Test; a separately reviewed three-band derivative is allowed |
| Very small / favicon | Monochrome or a dedicated future pixel icon |

The retained 16/24/32/64px proof shows that 24px breaks stems into strips
and 32px closes some subpixel LCD gaps under crisp rasterization. Prefer
64px or larger for this LCD wordmark; monochrome helps color contrast but
cannot restore gaps below a pixel. No three-band derivative or icon is
included yet. Test whole-number scales; do not smooth or blur the mark.

## 10. Presentation and accessibility

Canonical assets have hard RGB555 bands. A smooth marketing fade is an
optional, explicitly non-canonical presentation effect with extra colors.
Animation may change the separate band layer while retaining the mask;
no timing or animation sequence is specified by this interim system.

No special transparent color is needed: alpha comes from empty glyph
geometry, plus Scanline's additional gaps. Do not bake a background into
the standard SVG. White, near-black, midtone and saturated examples are
proofs only. The 640 × 480 boot/shutdown composition is a static host proof,
not an installed screen or guest screenshot.

Keep an accessible text name in UI, for example:

```html
<a href="/" aria-label="pixelelated">
  <!-- outlined SVG wordmark -->
</a>
```

## 11. Default hierarchy

1. **Ocean Bands:** canonical multicolor default.
2. **Neon Fade:** expressive dark-background alternate.
3. **Pixel Spectrum:** broad hero and marketing treatment.
4. **Scanline:** display/CRT alternate.
5. **Dual Fade:** directional alternate for wide lockups.
6. **Sunrise:** warm alternate.

Keep all six until use provides a reason to narrow the system. Reuse the
same canonical assets for boot, shutdown and interface integration instead
of recreating the lettering independently.

## 12. Production checklist

- [x] Exactly lowercase `pixelelated`, from the actual Tiny5 Duo LCD face.
- [x] Exactly five defined colors per multicolor treatment; RGB555 retained.
- [x] Computed hex equivalents follow the canonical formula.
- [x] Standard SVGs have no background or embedded font/image.
- [x] LCD negative space remains transparent; boundaries remain hard.
- [x] Scanline adds transparent rows; Dual Fade runs left to right.
- [x] Editable live-text master and outlined distribution copies retained.
- [x] Monochrome light and dark variants retained.
- [x] Background and small-size proofs inspected; limitations above recorded.
- [ ] Final screen integrations pass the renderer and new-image VM checks in #409.

This extends the supplied Rasteratops/Blitterbot art-system principles:
real lettering, pixel alignment, explicit RGB555 palettes, and separately
controllable bands and decoration. The LCD clarification governs this
wordmark; no character art is introduced.
