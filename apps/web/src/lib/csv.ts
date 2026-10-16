/** Planilha CSV (separador ;, para o Excel em português) como link de download, com BOM para os acentos. */
export function linkCsv(
  cabecalho: string[],
  linhas: (string | number | null)[][],
): string {
  const celula = (v: string | number | null) => {
    const t =
      v === null
        ? ""
        : typeof v === "number"
          ? v.toLocaleString("pt-BR", {
              useGrouping: false,
              maximumFractionDigits: 3,
            })
          : v;
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const texto = [cabecalho, ...linhas]
    .map((l) => l.map(celula).join(";"))
    .join("\r\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(`﻿${texto}`)}`;
}
