import type { NextRequest } from "next/server";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";

/**
 * Exporta uma lista em CSV, respeitando os filtros da tela. O botão "Exportar" de cada tela aponta para cá
 * com `recurso` (uma chave da lista permitida abaixo) e os mesmos filtros da URL. Traz todas as linhas que
 * batem com o filtro (não só a página atual) e devolve um arquivo para abrir no Excel.
 */
const RECURSOS: Record<string, { api: string; nome: string }> = {
  "nao-conformidades": { api: "/nao-conformidades", nome: "nao-conformidades" },
  calibracao: { api: "/instrumentos", nome: "instrumentos" },
  inspecoes: { api: "/inspecoes", nome: "inspecoes" },
  "planos-de-acao": { api: "/planos-de-acao", nome: "planos-de-acao" },
  auditorias: { api: "/auditorias", nome: "auditorias" },
  acidentes: { api: "/acidentes", nome: "acidentes" },
  "permissoes-de-trabalho": {
    api: "/permissoes-de-trabalho",
    nome: "permissoes-de-trabalho",
  },
  pgr: { api: "/riscos", nome: "pgr-riscos" },
  terceiros: { api: "/terceiros", nome: "terceiros" },
  vencimentos: { api: "/vencimentos", nome: "vencimentos" },
  ordens: { api: "/ordens-de-servico", nome: "ordens-de-servico" },
  "entregas-de-epi": { api: "/epis/entregas", nome: "entregas-de-epi" },
};

/** Escapa um valor para uma célula CSV (aspas, vírgula, quebra de linha). */
function celula(valor: unknown): string {
  let texto: string;
  if (valor === null || valor === undefined) texto = "";
  else if (typeof valor === "boolean") texto = valor ? "Sim" : "Não";
  else if (Array.isArray(valor)) texto = valor.join("; ");
  else if (typeof valor === "object") texto = "";
  else texto = String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const chave = params.get("recurso") ?? "";
  const recurso = RECURSOS[chave];
  if (!recurso) return new Response("Recurso inválido.", { status: 400 });

  const consulta = new URLSearchParams();
  for (const [k, v] of params) {
    if (k === "recurso" || k === "nome" || k === "pagina" || k === "ids")
      continue;
    consulta.set(k, v);
  }
  consulta.set("porPagina", "100");

  const r = await chamarApi<unknown>(`${recurso.api}?${consulta}`);
  if (!r.ok)
    return new Response(`Não foi possível exportar: ${r.erro.mensagem}`, {
      status: 502,
    });

  const dados = r.dados;
  let linhas = (
    Array.isArray(dados) ? dados : ((dados as { itens?: unknown[] }).itens ?? [])
  ) as Record<string, unknown>[];

  // Só as selecionadas, quando a barra de seleção manda os ids
  const ids = params.get("ids");
  if (ids) {
    const marcados = new Set(ids.split(",").filter(Boolean));
    linhas = linhas.filter((l) => marcados.has(String(l.id)));
  }

  let csv: string;
  if (linhas.length === 0) {
    csv = "Sem registros para os filtros atuais.";
  } else {
    const colunas = Object.keys(linhas[0]!).filter(
      (k) => typeof linhas[0]![k] !== "object" || Array.isArray(linhas[0]![k]),
    );
    const cabecalho = colunas.map(celula).join(";");
    const corpo = linhas
      .map((linha) => colunas.map((c) => celula(linha[c])).join(";"))
      .join("\n");
    csv = `${cabecalho}\n${corpo}`;
  }

  const arquivo = `${recurso.nome}-${hojeEmBrasilia()}.csv`;
  // BOM para o Excel reconhecer o UTF-8 (acentos)
  return new Response(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${arquivo}"`,
    },
  });
}
