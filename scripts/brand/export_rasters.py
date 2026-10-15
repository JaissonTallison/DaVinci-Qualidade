#!/usr/bin/env python3
"""Exporta os PNGs, o favicon e as peças sociais a partir dos SVGs da marca,
e sincroniza as cópias usadas pelo app web (apps/web).

Fonte da verdade: brand/svg/ e brand/favicon/icon.svg (gerados por build_svgs.py).
Requisitos: Pillow + ImageMagick 7 (`magick`) com suporte a SVG (librsvg).
Uso:        python3 scripts/brand/export_rasters.py
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "brand"
SVG = BRAND / "svg"
PNG = BRAND / "png"
FAVICON = BRAND / "favicon"
WEB = ROOT / "apps" / "web"

NAVY = (0, 18, 40, 255)        # #001228
PAPER = (255, 255, 255, 255)
MODES = ["", "-fundo-escuro", "-mono-preto", "-mono-branco"]


def render(svg: Path, width: int, height: int | None = None) -> Image.Image:
    """Rasteriza um SVG via librsvg na largura (ou caixa) pedida, fundo transparente."""
    from xml.etree import ElementTree as ET

    vb_w, vb_h = (float(v) for v in ET.parse(svg).getroot().get("viewBox").split()[2:])
    scale = width / vb_w if height is None else min(width / vb_w, height / vb_h)
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "out.png"
        subprocess.run(
            ["magick", "-background", "none", "-density", f"{96 * scale:.4f}", str(svg),
             "-resize", f"{round(vb_w * scale)}x{round(vb_h * scale)}!", f"PNG32:{out}"],
            check=True,
        )
        return Image.open(out).convert("RGBA").copy()


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  ✓ {path.relative_to(ROOT)}  ({img.width}x{img.height})")


def on_canvas(img: Image.Image, size: tuple[int, int], bg) -> Image.Image:
    canvas = Image.new("RGBA", size, bg)
    canvas.alpha_composite(img, ((size[0] - img.width) // 2, (size[1] - img.height) // 2))
    return canvas


# --------------------------------------------------------------------------- #

def export_logos() -> None:
    groups = {
        "logo-horizontal": (512, 1024, 2048),
        "logo-empilhado": (512, 1024, 2048),
        "logotipo": (1024, 2048),
        "simbolo": (64, 128, 256, 512, 1024),
    }
    for group, widths in groups.items():
        for mode in MODES:
            src = SVG / group / f"davinci-{group}{mode}.svg"
            for w in widths:
                save(render(src, w), PNG / group / f"{src.stem}-{w}.png")


def export_icons() -> None:
    app = SVG / "icone-app" / "davinci-icone-app.svg"
    maskable = SVG / "icone-app" / "davinci-icone-app-maskable.svg"
    for size in (1024, 512, 192):
        save(render(app, size), PNG / "icone-app" / f"davinci-icone-app-{size}.png")
    for size in (512, 192):
        save(render(maskable, size), PNG / "icone-app" / f"davinci-icone-app-maskable-{size}.png")
    # iOS aplica a própria máscara arredondada: o apple-touch-icon é quadrado e opaco
    save(render(maskable, 180).convert("RGB"), PNG / "icone-app" / "apple-touch-icon-180.png")

    # favicon.ico multi-resolução (16/32/48) a partir do SVG de favicon
    with tempfile.TemporaryDirectory() as tmp:
        layers = []
        for size in (16, 32, 48):
            p = Path(tmp) / f"{size}.png"
            render(FAVICON / "icon.svg", size).save(p)
            layers.append(str(p))
        subprocess.run(["magick", *layers, str(FAVICON / "favicon.ico")], check=True)
    print(f"  ✓ {(FAVICON / 'favicon.ico').relative_to(ROOT)}  (16, 32, 48)")


def export_social() -> None:
    horiz_dark = SVG / "logo-horizontal" / "davinci-logo-horizontal-fundo-escuro.svg"
    symbol_dark = SVG / "simbolo" / "davinci-simbolo-fundo-escuro.svg"
    horiz = SVG / "logo-horizontal" / "davinci-logo-horizontal.svg"

    # Open Graph / Twitter / WhatsApp (1200x630)
    save(on_canvas(render(horiz_dark, 840), (1200, 630), NAVY).convert("RGB"),
         PNG / "social" / "davinci-og-1200x630.png")
    # Capa LinkedIn (1584x396) — logo deslocada à direita (avatar cobre a esquerda)
    cover = Image.new("RGBA", (1584, 396), NAVY)
    logo = render(horiz_dark, 760, 230)
    cover.alpha_composite(logo, (1584 - logo.width - 120, (396 - logo.height) // 2))
    save(cover.convert("RGB"), PNG / "social" / "davinci-capa-linkedin-1584x396.png")
    # Avatar de perfil (recorte circular seguro: símbolo em ~62% do lado)
    save(on_canvas(render(symbol_dark, 250), (400, 400), NAVY).convert("RGB"),
         PNG / "social" / "davinci-avatar-400.png")

    # Assinatura de e-mail: fundo branco opaco (seguro em clientes com modo escuro)
    save(on_canvas(render(horiz, 560), (600, 230), PAPER).convert("RGB"),
         PNG / "email" / "davinci-assinatura-email-600.png")


# --------------------------------------------------------------------------- #
# Folha de apresentação da marca (brand/preview.png)
# --------------------------------------------------------------------------- #

def _font(size: int, bold: bool = False):
    name = "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"
    for base in (Path("/usr/share/fonts/liberation-sans-fonts"), Path("/usr/share/fonts/liberation")):
        if (base / name).exists():
            return ImageFont.truetype(str(base / name), size)
    return ImageFont.load_default(size)


def build_preview() -> None:
    W, cell_h, pad = 1600, 300, 40
    col_w = (W - pad * 3) // 2
    rows = [
        ("Logo horizontal — versão principal", "logo-horizontal", 600, 220),
        ("Logo empilhado", "logo-empilhado", 400, 230),
        ("Logotipo", "logotipo", 560, 200),
        ("Símbolo", "simbolo", 220, 220),
    ]
    H = 150 + len(rows) * (60 + 2 * (cell_h + 10)) + 300
    sheet = Image.new("RGBA", (W, H), (246, 246, 244, 255))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 40), "DaVinci Qualidade — Identidade visual", font=_font(44, True), fill=NAVY)
    d.text((pad, 98), "Versões oficiais da marca  ·  gerado por scripts/brand", font=_font(22), fill=(90, 96, 110))

    y = 150
    for title, group, w, h in rows:
        d.text((pad, y), title, font=_font(24, True), fill=NAVY)
        y += 40
        for row_modes in (("", "-fundo-escuro"), ("-mono-preto", "-mono-branco")):
            for i, mode in enumerate(row_modes):
                x = pad + i * (col_w + pad)
                bg = NAVY if mode in ("-fundo-escuro", "-mono-branco") else PAPER
                cell = Image.new("RGBA", (col_w, cell_h - 40), bg)
                art = render(SVG / group / f"davinci-{group}{mode}.svg", w, h)
                cell = on_canvas(art, cell.size, bg)
                sheet.alpha_composite(cell, (x, y))
                label = mode.strip("-").replace("-", " ") or "cor"
                d.text((x, y + cell_h - 34), label, font=_font(18), fill=(90, 96, 110))
            y += cell_h + 10
        y += 10

    d.text((pad, y), "Ícones e favicon", font=_font(24, True), fill=NAVY)
    y += 44
    x = pad
    for name, size in (("davinci-icone-app.svg", 220), ("davinci-icone-app-maskable.svg", 220)):
        sheet.alpha_composite(render(SVG / "icone-app" / name, size), (x, y))
        x += size + 40
    for size in (64, 32, 16):
        sheet.alpha_composite(render(FAVICON / "icon.svg", size), (x, y + 220 - size))
        x += size + 30
    save(sheet.convert("RGB"), BRAND / "preview.png")


# --------------------------------------------------------------------------- #
# Sincroniza com o app web (Next.js — convenções de metadata em app/)
# --------------------------------------------------------------------------- #

def sync_web() -> None:
    if not WEB.exists():
        print("  · apps/web ainda não existe: sincronização pulada")
        return
    app = WEB / "src" / "app"
    public = WEB / "public" / "brand"
    if public.exists():
        shutil.rmtree(public)
    copies = {
        # Convenções de arquivo do App Router (geram as <link>/<meta> automaticamente)
        FAVICON / "favicon.ico": app / "favicon.ico",
        FAVICON / "icon.svg": app / "icon.svg",
        PNG / "icone-app" / "apple-touch-icon-180.png": app / "apple-icon.png",
        PNG / "social" / "davinci-og-1200x630.png": app / "opengraph-image.png",
        # Arquivos estáticos usados pela UI e pelo manifest
        SVG / "logo-horizontal" / "davinci-logo-horizontal.svg": public / "logo.svg",
        SVG / "logo-horizontal" / "davinci-logo-horizontal-fundo-escuro.svg": public / "logo-fundo-escuro.svg",
        SVG / "logo-empilhado" / "davinci-logo-empilhado.svg": public / "logo-empilhado.svg",
        SVG / "logo-empilhado" / "davinci-logo-empilhado-fundo-escuro.svg": public / "logo-empilhado-fundo-escuro.svg",
        SVG / "simbolo" / "davinci-simbolo.svg": public / "simbolo.svg",
        SVG / "simbolo" / "davinci-simbolo-fundo-escuro.svg": public / "simbolo-fundo-escuro.svg",
        PNG / "icone-app" / "davinci-icone-app-192.png": public / "icon-192.png",
        PNG / "icone-app" / "davinci-icone-app-512.png": public / "icon-512.png",
        PNG / "icone-app" / "davinci-icone-app-maskable-512.png": public / "icon-maskable-512.png",
    }
    for src, dst in copies.items():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        print(f"  → {dst.relative_to(ROOT)}")
    (app / "opengraph-image.alt.txt").write_text("DaVinci Qualidade\n", encoding="utf-8")
    # Next.js recusa favicon duplicado em public/ e app/
    for stale in (WEB / "public" / "favicon.ico", WEB / "public" / "icon.svg"):
        stale.unlink(missing_ok=True)


def main() -> None:
    print("Exportando rasters da marca DaVinci Qualidade…")
    if PNG.exists():
        shutil.rmtree(PNG)
    export_logos()
    export_icons()
    export_social()
    build_preview()
    sync_web()
    print("Concluído.")


if __name__ == "__main__":
    main()
