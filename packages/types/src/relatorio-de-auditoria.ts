/**
 * Relatório de auditoria: índice de conformidade, resultado e a revisão automática antes de gerar o PDF.
 * As verificações são orientativas: o relatório pode sair a qualquer momento. docs/05-modulos/auditorias.md
 */
import type {
  Auditoria,
  KitPreAuditoria,
  RespostaDaPergunta,
  RoteiroDaAuditoria,
} from './auditorias.js';

/** Conformes ÷ (conformes + parciais + não conformes) × 100, inteiro. Sem respostas, não há índice. */
export function indiceDeConformidade(
  c: Record<RespostaDaPergunta, number>,
): number | null {
  const avaliadas = c.conforme + c.parcial + c.nao_conforme;
  return avaliadas ? Math.round((c.conforme / avaliadas) * 100) : null;
}

export const RESULTADOS_DA_AUDITORIA = {
  nao_conforme: 'Não conforme',
  com_melhorias: 'Sistema implementado, com pontos de melhoria',
  conforme: 'Sistema conforme',
} as const;
export type ResultadoDaAuditoria = keyof typeof RESULTADOS_DA_AUDITORIA;

/** Qualquer NC (constatação ou resposta) → não conforme; parcial, observação ou oportunidade → com pontos de melhoria. */
export function resultadoDaAuditoria(
  a: Pick<Auditoria, 'contagem'>,
  respostas: Record<RespostaDaPergunta, number>,
): ResultadoDaAuditoria {
  const k = a.contagem;
  if (k.nc_maior + k.nc_menor + respostas.nao_conforme > 0)
    return 'nao_conforme';
  if (k.observacao + k.oportunidade + respostas.parcial > 0)
    return 'com_melhorias';
  return 'conforme';
}

/** Onde corrigir: a tela da jornada que resolve a pendência. */
export type DestinoDaVerificacao =
  | 'resumo'
  | 'kit'
  | 'plano'
  | 'roteiro'
  | 'execucao'
  | 'achados'
  | 'tratar'
  | 'relatorio';

export interface Verificacao {
  titulo: string;
  ok: boolean;
  /** O que falta, quando não está ok. */
  falta: string;
  destino: DestinoDaVerificacao;
}

/** As 20 verificações do relatório, na ordem em que aparecem. */
export function revisarRelatorio(
  a: Auditoria,
  r: Pick<RoteiroDaAuditoria, 'perguntas' | 'contagem'>,
  kit: Pick<KitPreAuditoria, 'prontidao'> | null,
): Verificacao[] {
  const p = a.plano;
  const respondidas = r.perguntas.filter((q) => q.resposta !== 'pendente');
  const comAchado = new Set(a.constatacoes.map((c) => c.perguntaCodigo));
  const achados = r.perguntas.filter(
    (q) => q.resposta === 'parcial' || q.resposta === 'nao_conforme',
  );
  const ncs = a.constatacoes.filter(
    (c) => c.tipo === 'nc_maior' || c.tipo === 'nc_menor',
  );
  const semCobertura = p.processos.filter(
    (pr) => !respondidas.some((q) => q.processo === pr),
  );
  const v = (
    titulo: string,
    ok: boolean,
    falta: string,
    destino: DestinoDaVerificacao,
  ): Verificacao => ({ titulo, ok, falta, destino });
  return [
    v(
      'Normas auditadas definidas',
      a.normas.length > 0,
      'Selecione ao menos uma norma.',
      'resumo',
    ),
    v(
      'Período da auditoria informado',
      Boolean(a.dataInicio && a.dataFim),
      'Informe as datas de início e fim.',
      'resumo',
    ),
    v(
      'Equipe auditora registrada',
      Boolean(a.auditorLider),
      'Informe ao menos o auditor líder.',
      'resumo',
    ),
    v(
      'Escopo descrito',
      a.escopo.trim().length > 0,
      'Descreva o escopo da auditoria.',
      'resumo',
    ),
    v(
      'Organização auditada informada',
      Boolean(p.empresaAuditada),
      'Informe a organização auditada no plano.',
      'plano',
    ),
    v(
      'Objetivo descrito',
      Boolean(p.objetivo),
      'Descreva o objetivo da auditoria no plano.',
      'plano',
    ),
    v(
      'Critérios definidos',
      Boolean(p.criterios),
      'Confirme os critérios no plano.',
      'plano',
    ),
    v(
      'Processos auditados definidos',
      p.processos.length > 0,
      'Marque os processos cobertos no plano.',
      'plano',
    ),
    v(
      'Cronograma do plano',
      p.cronograma.length > 0,
      'Monte o cronograma hora a hora no plano.',
      'plano',
    ),
    v(
      'Kit pré-auditoria concluído',
      (kit?.prontidao ?? 0) === 100,
      `Prontidão do kit em ${kit?.prontidao ?? 0}%.`,
      'kit',
    ),
    v(
      'Perguntas registradas',
      r.perguntas.length > 0,
      'Nenhuma pergunta foi incluída no roteiro.',
      'roteiro',
    ),
    v(
      'Todas as perguntas avaliadas',
      r.perguntas.length > 0 && r.contagem.pendente === 0,
      r.perguntas.length
        ? `${r.contagem.pendente} pergunta(s) sem resposta.`
        : 'Sem perguntas para avaliar.',
      'execucao',
    ),
    v(
      'Respostas com evidência',
      respondidas.length > 0 && respondidas.every((q) => q.evidencia),
      respondidas.length
        ? 'Há resposta sem evidência objetiva.'
        : 'Sem perguntas respondidas.',
      'execucao',
    ),
    v(
      'Todos os processos auditados',
      p.processos.length > 0 && semCobertura.length === 0,
      p.processos.length
        ? `${semCobertura.length} processo(s) sem pergunta respondida.`
        : 'Nenhum processo definido.',
      'execucao',
    ),
    v(
      'Achados registrados',
      achados.every((q) => comAchado.has(q.codigo)),
      `${achados.filter((q) => !comAchado.has(q.codigo)).length} achado(s) Parcial ou Não conforme sem constatação.`,
      'achados',
    ),
    v(
      'NCs formalizadas na Qualidade',
      a.ncsPendentes === 0,
      `${a.ncsPendentes} NC(s) a formalizar.`,
      'achados',
    ),
    v(
      'NCs com causa raiz',
      ncs.every((c) => c.causaRaiz),
      'Há NC sem causa raiz provável.',
      'achados',
    ),
    v(
      'NCs com ação corretiva',
      ncs.every((c) => c.acaoCorretiva),
      'Há NC sem ação corretiva sugerida.',
      'achados',
    ),
    v(
      'Pontos fortes registrados',
      Boolean(p.pontosFortes),
      'Registre ao menos um ponto forte observado.',
      'relatorio',
    ),
    v(
      'Conclusão escrita',
      Boolean(a.conclusao),
      'Escreva a conclusão da auditoria (é o que a diretoria lê primeiro).',
      'relatorio',
    ),
  ];
}

export interface ProximoPasso {
  titulo: string;
  descricao: string;
  destino: DestinoDaVerificacao;
}

/** O que fazer agora na auditoria, na ordem da jornada (o primeiro pendente ganha). */
export function proximoPasso(
  a: Pick<Auditoria, 'status' | 'plano' | 'constatacoes' | 'ncsPendentes'>,
  r: Pick<RoteiroDaAuditoria, 'perguntas' | 'contagem'>,
  kit: Pick<KitPreAuditoria, 'prontidao'> | null,
): ProximoPasso {
  const passo = (
    titulo: string,
    descricao: string,
    destino: DestinoDaVerificacao,
  ) => ({ titulo, descricao, destino });
  if (a.status === 'cancelada')
    return passo(
      'Auditoria cancelada',
      'Nada mais a fazer nesta auditoria.',
      'resumo',
    );
  if (a.status === 'concluida')
    return passo(
      'Entregue o relatório',
      'Gere o PDF e acompanhe as NCs até a eficácia.',
      'relatorio',
    );
  if (a.status === 'planejada') {
    if (!a.plano.objetivo || a.plano.processos.length === 0)
      return passo(
        'Monte o plano de auditoria',
        'Objetivo, processos, cronograma e convocados para enviar ao auditado.',
        'plano',
      );
    if (r.perguntas.length === 0)
      return passo(
        'Escolha as perguntas do roteiro',
        'De 8 a 15 por processo é um roteiro realista.',
        'roteiro',
      );
    if ((kit?.prontidao ?? 0) < 100)
      return passo(
        'Continue o kit pré-auditoria',
        `Prontidão em ${kit?.prontidao ?? 0}%. Feche os itens da linha do tempo.`,
        'kit',
      );
    return passo(
      'Inicie a auditoria',
      'No dia, inicie para registrar as respostas.',
      'resumo',
    );
  }
  if (r.contagem.pendente > 0)
    return passo(
      'Responda as perguntas',
      `${r.contagem.pendente} pergunta(s) sem resposta no roteiro.`,
      'execucao',
    );
  const comAchado = new Set(a.constatacoes.map((c) => c.perguntaCodigo));
  const achados = r.perguntas.filter(
    (q) =>
      (q.resposta === 'parcial' || q.resposta === 'nao_conforme') &&
      !comAchado.has(q.codigo),
  ).length;
  if (achados > 0)
    return passo(
      'Registre os achados',
      `${achados} resposta(s) Parcial ou Não conforme sem constatação.`,
      'achados',
    );
  if (a.ncsPendentes > 0)
    return passo(
      'Formalize as NCs',
      `${a.ncsPendentes} NC(s) a abrir na Qualidade.`,
      'achados',
    );
  return passo(
    'Feche o relatório',
    'Revise as verificações, registre os pontos fortes e conclua.',
    'relatorio',
  );
}
