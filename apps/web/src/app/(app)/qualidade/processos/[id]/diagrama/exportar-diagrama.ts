import {
  ACENTO_DO_NO,
  ACENTO_PADRAO,
  ALTURA_DO_NO,
  LARGURA_DO_NO,
  type DadosDoNo,
} from "./elementos";

type NoExp = { id: string; position: { x: number; y: number }; data: DadosDoNo };
type ArestaExp = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  label?: unknown;
};

const TEXTO = "#102A43";
const LINHA = "#334155";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function truncar(s: string, largura: number): string {
  const max = Math.max(4, Math.floor((largura - 16) / 6.6));
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function corDe(d: DadosDoNo): string {
  return ACENTO_DO_NO[d.categoria] ?? ACENTO_PADRAO;
}

/** Gera um SVG completo do diagrama a partir dos nós e conexões. */
export function gerarSvg(
  nos: NoExp[],
  arestas: ArestaExp[],
): { svg: string; width: number; height: number } {
  const P = 40;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nos) {
    const w = LARGURA_DO_NO[n.data.forma];
    const h = ALTURA_DO_NO[n.data.forma];
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 240;
    maxY = 120;
  }
  const width = Math.round(maxX - minX + 2 * P);
  const height = Math.round(maxY - minY + 2 * P);
  const dx = -minX + P;
  const dy = -minY + P;
  const porId = new Map(nos.map((n) => [n.id, n]));

  const corpoArestas = arestas
    .map((a) => arestaSvg(a, porId, dx, dy))
    .join("");
  const corpoNos = nos.map((n) => noSvg(n, dx, dy)).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, Helvetica, sans-serif"><rect width="${width}" height="${height}" fill="#ffffff"/><defs><marker id="seta" markerWidth="10" markerHeight="8" refX="8" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,3 L0,6 Z" fill="${LINHA}"/></marker></defs>${corpoArestas}${corpoNos}</svg>`;
  return { svg, width, height };
}

function pontoOrigem(
  n: NoExp,
  handle: string | null | undefined,
  dx: number,
  dy: number,
) {
  const w = LARGURA_DO_NO[n.data.forma];
  const h = ALTURA_DO_NO[n.data.forma];
  const x = n.position.x + dx;
  const y = n.position.y + dy;
  if (handle === "sim") return { x: x + w, y: y + h / 2 };
  if (handle === "nao") return { x, y: y + h / 2 };
  return { x: x + w / 2, y: y + h };
}
function pontoTopo(n: NoExp, dx: number, dy: number) {
  const w = LARGURA_DO_NO[n.data.forma];
  return { x: n.position.x + dx + w / 2, y: n.position.y + dy };
}

function arestaSvg(
  a: ArestaExp,
  porId: Map<string, NoExp>,
  dx: number,
  dy: number,
): string {
  const s = porId.get(a.source);
  const t = porId.get(a.target);
  if (!s || !t) return "";
  const p1 = pontoOrigem(s, a.sourceHandle, dx, dy);
  const p2 = pontoTopo(t, dx, dy);
  const linha = `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${LINHA}" stroke-width="2" marker-end="url(#seta)"/>`;
  const rotulo = a.label
    ? `<text x="${(p1.x + p2.x) / 2}" y="${(p1.y + p2.y) / 2 - 4}" font-size="11" fill="${LINHA}" text-anchor="middle">${esc(String(a.label))}</text>`
    : "";
  return linha + rotulo;
}

function noSvg(n: NoExp, dx: number, dy: number): string {
  const d = n.data;
  const w = LARGURA_DO_NO[d.forma];
  const h = ALTURA_DO_NO[d.forma];
  const x = n.position.x + dx;
  const y = n.position.y + dy;
  const cor = corDe(d);
  const comum = `fill="#ffffff" stroke="${cor}" stroke-width="2" stroke-linejoin="round"`;
  const nome = esc(truncar(d.nome || d.rotulo, w));
  const cx = x + w / 2;

  let forma = "";
  let texto = "";

  if (d.forma === "decisao") {
    forma = `<polygon points="${cx},${y + 2} ${x + w - 2},${y + h / 2} ${cx},${y + h - 2} ${x + 2},${y + h / 2}" ${comum}/>`;
    texto = `<text x="${cx}" y="${y + h / 2}" font-size="12" fill="${TEXTO}" text-anchor="middle" dominant-baseline="middle">${nome}</text>`;
  } else if (d.forma === "dados") {
    forma = `<polygon points="${x + 16},${y + 2} ${x + w - 2},${y + 2} ${x + w - 16},${y + h - 2} ${x + 2},${y + h - 2}" ${comum}/>`;
    texto = textoCentral(cx, y + h / 2, nome);
  } else if (d.forma === "documento") {
    forma = `<path d="M${x + 2},${y + 2} L${x + w - 16},${y + 2} L${x + w - 2},${y + 16} L${x + w - 2},${y + h - 2} L${x + 2},${y + h - 2} Z" ${comum}/><path d="M${x + w - 16},${y + 2} L${x + w - 16},${y + 16} L${x + w - 2},${y + 16}" fill="none" stroke="${cor}" stroke-width="2"/>`;
    texto = textoCentral(cx, y + h / 2 + 2, nome);
  } else if (d.forma === "armazenamento") {
    forma = `<path d="M${x + 2},${y + 11} L${x + 2},${y + h - 11} A ${w / 2 - 2} 9 0 0 0 ${x + w - 2},${y + h - 11} L${x + w - 2},${y + 11}" ${comum}/><ellipse cx="${cx}" cy="${y + 11}" rx="${w / 2 - 2}" ry="9" ${comum}/>`;
    texto = textoCentral(cx, y + h / 2 + 6, nome);
  } else if (d.forma === "terminal") {
    forma = `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${(h - 2) / 2}" ${comum}/>`;
    texto = textoCentral(cx, y + h / 2, nome);
  } else if (d.forma === "qualidade") {
    forma = `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="8" ${comum}/><rect x="${x + 1}" y="${y + 1}" width="5" height="${h - 2}" fill="${cor}"/>`;
    texto = `<text x="${cx}" y="${y + 20}" font-size="10" fill="${LINHA}" text-anchor="middle" letter-spacing="0.4">${esc(d.rotulo.toUpperCase())}</text><text x="${cx}" y="${y + h - 16}" font-size="13" fill="${TEXTO}" text-anchor="middle">${nome}</text>`;
  } else {
    // processo, subprocesso, anotacao
    const tracejado =
      d.forma === "anotacao" ? ` stroke-dasharray="5 3"` : "";
    forma = `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="8" ${comum}${tracejado}/>`;
    if (d.forma === "subprocesso")
      forma += `<line x1="${x + 7}" y1="${y + 1}" x2="${x + 7}" y2="${y + h - 1}" stroke="${cor}" stroke-width="2"/><line x1="${x + w - 7}" y1="${y + 1}" x2="${x + w - 7}" y2="${y + h - 1}" stroke="${cor}" stroke-width="2"/>`;
    texto = textoCentral(cx, y + h / 2, nome);
  }
  return forma + texto;
}

function textoCentral(cx: number, cy: number, nome: string): string {
  return `<text x="${cx}" y="${cy}" font-size="13" fill="${TEXTO}" text-anchor="middle" dominant-baseline="middle">${nome}</text>`;
}

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function baixarSvg(svg: string, nome: string) {
  baixarBlob(new Blob([svg], { type: "image/svg+xml" }), `${nome}.svg`);
}

export function baixarTexto(conteudo: string, nome: string, mime: string) {
  baixarBlob(new Blob([conteudo], { type: mime }), nome);
}

/** Desenha o SVG num canvas (2x) e baixa como PNG — sem dependência externa. */
export async function baixarPng(
  svg: string,
  width: number,
  height: number,
  nome: string,
): Promise<void> {
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao renderizar o diagrama."));
      img.src = url;
    });
    const escala = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * escala;
    canvas.height = height * escala;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(escala, escala);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    await new Promise<void>((resolve) => {
      canvas.toBlob((b) => {
        if (b) baixarBlob(b, `${nome}.png`);
        resolve();
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
