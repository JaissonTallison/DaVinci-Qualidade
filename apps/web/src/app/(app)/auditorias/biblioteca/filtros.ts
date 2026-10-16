import { PACKS_ANTI_NC } from "@davinci/types";

/** Packs Anti-NC como opções de filtro. */
export const PACKS = Object.fromEntries(
  Object.entries(PACKS_ANTI_NC).map(([k, p]) => [k, p.nome]),
);

/** Filtros da biblioteca vindos da URL, repassados à API e à página de impressão. */
export function filtrosDaBiblioteca(f: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const k of ["pack", "norma", "clausula", "tema", "controle", "busca"])
    if (f[k]) p.set(k, f[k]!);
  return p;
}

export const CAPITULOS = {
  "4": "Cláusula 4",
  "5": "Cláusula 5",
  "6": "Cláusula 6",
  "7": "Cláusula 7",
  "8": "Cláusula 8",
  "9": "Cláusula 9",
  "10": "Cláusula 10",
  A: "Anexo A (ISO 27001)",
};
