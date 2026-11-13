import type { ArestaGerada, NoGerado } from "./bpmn";

/**
 * Gera um RASCUNHO de diagrama a partir de texto, por heurística determinística.
 * Lê uma etapa por linha (tira numeração/marcador) e marca como decisão as linhas que
 * começam com "se/caso/quando" ou terminam com "?". Não inventa nada: só usa o que está no texto.
 * Arquitetado para, no futuro, ser trocado por um provedor de IA (LLM) atrás desta mesma função.
 */
export function gerarDoTexto(texto: string): {
  nodes: NoGerado[];
  edges: ArestaGerada[];
} {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(\d+[.)]|[-*•]|[a-z][.)])\s*/i, "").trim())
    .filter((l) => l.length > 0)
    .slice(0, 60);
  if (linhas.length === 0) return { nodes: [], edges: [] };

  const nodes: NoGerado[] = [];
  const edges: ArestaGerada[] = [];
  const X = 260;
  let y = 40;
  const passo = 100;
  let anterior: string | null = null;

  const empurrar = (
    forma: NoGerado["data"]["forma"],
    categoria: string,
    rotulo: string,
    campo: "nome" | "pergunta",
    valor: string,
  ) => {
    const id = crypto.randomUUID();
    nodes.push({
      id,
      type: "no",
      position: { x: X, y },
      data: { forma, categoria, rotulo, nome: valor, [campo]: valor },
    });
    y += passo;
    if (anterior)
      edges.push({
        id: `e_${anterior}_${id}`,
        source: anterior,
        target: id,
        markerEnd: { type: "arrowclosed" },
      });
    anterior = id;
  };

  empurrar("terminal", "inicio", "Início", "nome", "Início");
  for (const linha of linhas) {
    const ehDecisao = /^(se|caso|quando)\b/i.test(linha) || /\?\s*$/.test(linha);
    if (ehDecisao) empurrar("decisao", "decisao", "Decisão", "pergunta", linha);
    else empurrar("processo", "processo", "Processo", "nome", maiuscula(linha));
  }
  empurrar("terminal", "fim", "Fim", "nome", "Fim");

  return { nodes, edges };
}

function maiuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
