#!/usr/bin/env python3
"""Gera os SVGs vetoriais da marca DaVinci Qualidade.

A logo original (brand/source/original/) é um raster. Este script reconstrói a
marca em vetor usando as medidas extraídas dela — mesmas proporções, posições e
cores — com todo o texto convertido em curvas (não depende de fontes instaladas).

Coordenadas: o espaço em pixels da logo original da DaVinci Qualidade (857x308).
A logo da Qualidade (951x343) tem o mesmo símbolo e o mesmo "daVINCI", só que
ampliados em 1,0866x. As medidas novas (estrela e tagline) foram convertidas para
esse espaço; assim o símbolo e o nome são idênticos em toda a família DaVinci.
Depois cada versão recorta seu próprio viewBox.

Requisitos: fonttools  (pip install -r scripts/brand/requirements.txt)
Uso:        python3 scripts/brand/build_svgs.py
"""

from __future__ import annotations

import math

from dataclasses import dataclass
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "brand"
FONTS = BRAND / "source" / "fonts"
SVG = BRAND / "svg"

SERIF_BOLD = TTFont(FONTS / "LiberationSerif-Bold.ttf")
SERIF_REGULAR = TTFont(FONTS / "LiberationSerif-Regular.ttf")


# --------------------------------------------------------------------------- #
# Tipografia → curvas
# --------------------------------------------------------------------------- #

def _glyph(font: TTFont, char: str):
    gs = font.getGlyphSet()
    return gs, font.getBestCmap()[ord(char)]


def glyph_bounds(font: TTFont, char: str) -> tuple[float, float, float, float]:
    gs, name = _glyph(font, char)
    pen = BoundsPen(gs)
    gs[name].draw(pen)
    return pen.bounds


def glyph_path(font: TTFont, char: str, height: float, left: float, baseline: float,
               ref: str | None = None) -> str:
    """Desenha `char` com altura de maiúscula `height` (medida em `ref`),
    borda esquerda em `left` e linha de base em `baseline`."""
    _, _, _, ref_top = glyph_bounds(font, ref or char)
    scale = height / ref_top
    x_min, *_ = glyph_bounds(font, char)
    gs, name = _glyph(font, char)
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    tx = left - x_min * scale
    gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, tx, baseline)))
    return pen.getCommands()


def text_paths(font: TTFont, text: str, cap: float, left: float, right: float,
               baseline: float) -> list[str]:
    """Compõe `text` com altura de maiúscula `cap`, entre as bordas `left` e `right`.
    Usa o avanço natural da fonte e distribui a sobra como espaçamento entre letras
    (é assim que a medição da original se encaixa sem posicionar letra a letra)."""
    _, _, _, cap_top = glyph_bounds(font, "I")
    scale = cap / cap_top
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    glyphs = [(ch, cmap[ord(ch)]) for ch in text]
    first_min = glyph_bounds(font, text[0])[0]
    natural = sum(hmtx[g][0] for _, g in glyphs[:-1]) + glyph_bounds(font, text[-1])[2] - first_min
    gaps = sum(1 for ch, _ in glyphs[:-1])
    track = ((right - left) - natural * scale) / gaps
    x = left - first_min * scale
    out = []
    for ch, name in glyphs:
        if ch != " ":
            pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
            gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
            out.append(pen.getCommands())
        x += hmtx[name][0] * scale + track
    return out


def glyph_right_edge_left(font: TTFont, char: str, height: float, right: float,
                          ref: str | None = None) -> float:
    """Converte uma borda direita desejada na borda esquerda equivalente."""
    _, _, _, ref_top = glyph_bounds(font, ref or char)
    scale = height / ref_top
    x_min, _, x_max, _ = glyph_bounds(font, char)
    return right - (x_max - x_min) * scale


# --------------------------------------------------------------------------- #
# Paletas por modo de cor
# --------------------------------------------------------------------------- #

@dataclass(frozen=True)
class Mode:
    suffix: str
    label: str
    ink: str
    gold: tuple[str, ...] | str              # moldura: gradiente (stops) ou cor sólida
    tagline: str                             # QUALIDADE e CERTIFICAÇÕES
    star: tuple[tuple[str, ...], tuple[str, ...]] | str   # faces claras, faces escuras


MODES = [
    Mode("", "cor — fundo claro", "#001228",
         ("#E3A945", "#A06D10", "#C8902E", "#7A520A"),
         "#986600",
         (("#FFF4C2", "#E3B85C", "#C8902E"), ("#A9803E", "#7A520A", "#4A3723"))),
    Mode("-fundo-escuro", "cor — fundo escuro", "#FFFFFF",
         ("#F8DA8C", "#D9A441", "#F0C66A", "#A8761E"),
         "#E8B860",
         (("#FFF8D6", "#F3CF7A", "#D9A441"), ("#C99A4A", "#A8761E", "#7A520A"))),
    Mode("-mono-preto", "monocromática preta", "#000000", "#000000", "#000000", "#000000"),
    Mode("-mono-branco", "monocromática branca", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"),
]


def gradient(gid: str, stops: tuple[str, ...], x1, y1, x2, y2) -> str:
    n = len(stops) - 1
    s = "".join(f'<stop offset="{i / n:.2f}" stop-color="{c}"/>' for i, c in enumerate(stops))
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" '
            f'x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>')


def paint(value, gid: str) -> str:
    return value if isinstance(value, str) else f"url(#{gid})"


# --------------------------------------------------------------------------- #
# Peças da marca (no espaço de coordenadas da original)
# --------------------------------------------------------------------------- #

# Construção Vitruviana: círculo e quadrado tangentes na base.
CX, CY, R = 238, 132.5, 102
SQ = 176
SQ_X, SQ_Y = CX - SQ / 2, CY + R - SQ
STROKE = 6

SYMBOL_BOX = (CX - R - STROKE / 2, CY - R - STROKE / 2, 2 * R + STROKE, 2 * R + STROKE)
WORD_BOX = (347, 110, 355, 128)  # "da VINCI" + estrela + QUALIDADE e CERTIFICAÇÕES


def symbol_parts(mode: Mode, stroke: float = STROKE) -> tuple[str, str]:
    defs = ""
    if not isinstance(mode.gold, str):
        x, y, w, h = SYMBOL_BOX
        defs += gradient("gold", mode.gold, x, y, x + w, y + h)
    gold = paint(mode.gold, "gold")

    d_left, dv_top, dv_base = 156, 87, 188
    h = dv_base - dv_top
    v_left = glyph_right_edge_left(SERIF_BOLD, "V", h, 320, ref="D")
    body = (
        f'<g fill="none" stroke="{gold}" stroke-width="{stroke}">'
        f'<circle cx="{CX}" cy="{CY}" r="{R}"/>'
        f'<rect x="{SQ_X}" y="{SQ_Y}" width="{SQ}" height="{SQ}"/>'
        f"</g>"
        f'<g fill="{mode.ink}">'
        f'<path d="{glyph_path(SERIF_BOLD, "D", h, d_left, dv_base)}"/>'
        f'<path d="{glyph_path(SERIF_BOLD, "V", h, v_left, dv_base, ref="D")}"/>'
        f"</g>"
    )
    return defs, body


# Estrela de 5 pontas regular, com bisel (cada braço tem uma face clara e uma escura).
# Medida na original da Qualidade: centro (540,5; 222), raio 42 → convertido.
STAR_CX, STAR_CY, STAR_R = 487.7, 198.6, 38.65
STAR_INNER = 0.42  # raio interno / externo (um pouco mais cheia que a regular, 0,382)


def star_points() -> list[tuple[float, float]]:
    """10 vértices alternando ponta e vale, começando pela ponta de cima."""
    pts = []
    for i in range(10):
        r = STAR_R if i % 2 == 0 else STAR_R * STAR_INNER
        a = math.radians(-90 + i * 36)
        pts.append((STAR_CX + r * math.cos(a), STAR_CY + r * math.sin(a)))
    return pts


def star_svg(mode: Mode) -> tuple[str, str]:
    pts = star_points()
    fmt = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    if isinstance(mode.star, str):
        poly = " L".join(fmt(p) for p in pts)
        return "", f'<path d="M{poly} Z" fill="{mode.star}"/>'

    light, dark = mode.star
    x0, y0 = STAR_CX - STAR_R, STAR_CY - STAR_R
    x1, y1 = STAR_CX + STAR_R, STAR_CY + STAR_R
    defs = gradient("star-light", light, x0, y0, x1, y1) + gradient("star-dark", dark, x0, y0, x1, y1)
    c = (STAR_CX, STAR_CY)
    faces = []
    for i in range(10):
        tip, valley = (pts[i], pts[i + 1]) if i % 2 == 0 else (pts[(i + 1) % 10], pts[i])
        # face à direita de cada ponta fica na sombra: luz vindo de cima à esquerda
        fill = "star-dark" if i % 2 == 0 else "star-light"
        faces.append(f'<path d="M{fmt(c)} L{fmt(tip)} L{fmt(valley)} Z" fill="url(#{fill})"/>')
    # os triângulos se tocam por arestas: o stroke fino da mesma cor evita frestas no antialias
    return defs, f'<g stroke-linejoin="round">{"".join(faces)}</g>'


def wordmark_parts(mode: Mode) -> tuple[str, str]:
    base, cap = 175, 60
    letters = [
        (SERIF_REGULAR, "d", 349, "d"),
        (SERIF_REGULAR, "a", 395, "d"),
        (SERIF_BOLD, "V", 435, "I"),
        (SERIF_BOLD, "I", 502, "I"),
        (SERIF_BOLD, "N", 537, "I"),
        (SERIF_BOLD, "C", 605, "I"),
        (SERIF_BOLD, "I", 669, "I"),
    ]
    word = []
    for font, ch, left, ref in letters:
        height = 63 if ref == "d" else cap
        word.append(f'<path d="{glyph_path(font, ch, height, left, base, ref=ref)}"/>')

    # Tagline em duas linhas, serifada bold (medidas da original convertidas)
    tag = text_paths(SERIF_BOLD, "QUALIDADE e", 12.4, 539.8, 670.4, 199.7)
    tag += text_paths(SERIF_BOLD, "CERTIFICAÇÕES", 12.4, 535.2, 688.9, 220.0)

    defs, star = star_svg(mode)
    body = (
        f'<g fill="{mode.ink}">{"".join(word)}</g>'
        f"{star}"
        f'<g fill="{mode.tagline}">' + "".join(f'<path d="{d}"/>' for d in tag) + "</g>"
    )
    return defs, body


# --------------------------------------------------------------------------- #
# Montagem dos arquivos
# --------------------------------------------------------------------------- #

def fmt_box(box) -> str:
    return " ".join(f"{v:g}" for v in box)


def svg_doc(title: str, viewbox, defs: str, body: str, width: float | None = None) -> str:
    _, _, w, h = viewbox
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt_box(viewbox)}" '
        f'width="{w:g}" height="{h:g}" role="img" aria-labelledby="t">\n'
        f'<title id="t">{title}</title>\n'
        + (f"<defs>{defs}</defs>\n" if defs else "")
        + body
        + "\n</svg>\n"
    )


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✓ {path.relative_to(ROOT)}")


def union(*boxes):
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[0] + b[2] for b in boxes)
    y1 = max(b[1] + b[3] for b in boxes)
    return (x0, y0, x1 - x0, y1 - y0)


def pad(box, p):
    x, y, w, h = box
    return (x - p, y - p, w + 2 * p, h + 2 * p)


def build_logos() -> None:
    for mode in MODES:
        s_defs, s_body = symbol_parts(mode)
        w_defs, w_body = wordmark_parts(mode)
        name = "DaVinci Qualidade"

        # Horizontal (versão principal)
        box = pad(union(SYMBOL_BOX, WORD_BOX), 2)
        write(SVG / "logo-horizontal" / f"davinci-logo-horizontal{mode.suffix}.svg",
              svg_doc(f"{name} — logo horizontal ({mode.label})", box, s_defs + w_defs, s_body + w_body))

        # Empilhado: símbolo centralizado sobre o logotipo
        sx, sy, sw, sh = SYMBOL_BOX
        wx, wy, ww, wh = WORD_BOX
        gap = 18
        dx = (sx + sw / 2) - (wx + ww / 2)
        dy = (sy + sh + gap) - wy
        moved_word = (wx + dx, wy + dy, ww, wh)
        box = pad(union(SYMBOL_BOX, moved_word), 2)
        write(SVG / "logo-empilhado" / f"davinci-logo-empilhado{mode.suffix}.svg",
              svg_doc(f"{name} — logo empilhado ({mode.label})", box, s_defs + w_defs,
                      s_body + f'<g transform="translate({dx:g} {dy:g})">{w_body}</g>'))

        # Símbolo (monograma DV na moldura Vitruviana)
        write(SVG / "simbolo" / f"davinci-simbolo{mode.suffix}.svg",
              svg_doc(f"{name} — símbolo ({mode.label})", pad(SYMBOL_BOX, 1), s_defs, s_body))

        # Logotipo (só o nome)
        write(SVG / "logotipo" / f"davinci-logotipo{mode.suffix}.svg",
              svg_doc(f"{name} — logotipo ({mode.label})", pad(WORD_BOX, 2), w_defs, w_body))


NAVY = "#001228"
# Fundo do ícone de app e do favicon: o verde-petróleo do menu lateral (token `menu`).
FUNDO_DO_ICONE = "#1C5560"


def app_icon(size: int, *, radius: float, safe: float, stroke: float, title: str) -> str:
    """Símbolo (versão fundo escuro) centralizado sobre o verde-petróleo do menu.
    `safe` = fração do lado ocupada pelo símbolo."""
    mode = MODES[1]
    defs, body = symbol_parts(mode, stroke=stroke)
    sx, sy, sw, sh = SYMBOL_BOX
    scale = size * safe / sw
    tx = size / 2 - (sx + sw / 2) * scale
    ty = size / 2 - (sy + sh / 2) * scale
    return svg_doc(
        title, (0, 0, size, size), defs,
        f'<rect width="{size}" height="{size}" rx="{radius:g}" fill="{FUNDO_DO_ICONE}"/>'
        f'<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.4f})">{body}</g>',
    )


def build_icons() -> None:
    write(SVG / "icone-app" / "davinci-icone-app.svg",
          app_icon(512, radius=112, safe=0.74, stroke=7, title="DaVinci Qualidade — ícone de app"))
    # Maskable: sangra até a borda; símbolo dentro da zona segura (círculo de 80%)
    write(SVG / "icone-app" / "davinci-icone-app-maskable.svg",
          app_icon(512, radius=0, safe=0.58, stroke=7, title="DaVinci Qualidade — ícone maskable (PWA/Android)"))
    # Favicon: traço mais grosso para continuar legível em 16–32 px
    write(BRAND / "favicon" / "icon.svg",
          app_icon(64, radius=12, safe=0.9, stroke=11, title="DaVinci Qualidade"))


def main() -> None:
    print("Gerando SVGs da marca DaVinci Qualidade…")
    build_logos()
    build_icons()
    print("Concluído.")


if __name__ == "__main__":
    main()
