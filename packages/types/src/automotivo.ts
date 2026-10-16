/**
 * Automotivo (IATF 16949): FMEA de processo (AIAG-VDA 2019), plano de controle (IATF 8.5.1.1, anexo A) e
 * PPAP (AIAG, 4ª edição). Serviço qualidade. docs/05-modulos/automotivo.md
 */
import { z } from 'zod';
import {
  chaves,
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const nota = (rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo} (1 a 10).` })
    .int(`Informe ${rotulo} (1 a 10).`)
    .min(1, `Informe ${rotulo} (1 a 10).`)
    .max(10, `Informe ${rotulo} (1 a 10).`);
const curto = (max: number) => z.string().trim().max(max).default('');

// ---------------------------------------------------------------- prioridade de ação (AIAG-VDA)

export const PRIORIDADES_DE_ACAO = {
  H: 'Alta',
  M: 'Média',
  L: 'Baixa',
} as const;
export type PrioridadeDeAcao = keyof typeof PRIORIDADES_DE_ACAO;

const faixaO = (o: number) =>
  o >= 8 ? 0 : o >= 6 ? 1 : o >= 4 ? 2 : o >= 2 ? 3 : 4;
const faixaD = (d: number) => (d >= 7 ? 0 : d >= 5 ? 1 : d >= 2 ? 2 : 3);
/** Tabela AP do manual AIAG-VDA: [faixa de S][faixa de O] → D 7-10, 5-6, 2-4, 1. */
const TABELA_AP: Record<'s9' | 's7' | 's4' | 's2', string[]> = {
  s9: ['HHHH', 'HHHH', 'HHHM', 'HMLL', 'LLLL'],
  s7: ['HHHH', 'HHHM', 'HMMM', 'MMLL', 'LLLL'],
  s4: ['HHMM', 'MMML', 'MLLL', 'LLLL', 'LLLL'],
  s2: ['MMLL', 'LLLL', 'LLLL', 'LLLL', 'LLLL'],
};

/** Prioridade de Ação (AP) da AIAG-VDA, que substitui o NPR: severidade pesa mais que ocorrência, que pesa mais que detecção. */
export function prioridadeDeAcao(
  s: number,
  o: number,
  d: number,
): PrioridadeDeAcao {
  if (s <= 1) return 'L';
  const linha = s >= 9 ? 's9' : s >= 7 ? 's7' : s >= 4 ? 's4' : 's2';
  return TABELA_AP[linha][faixaO(o)]![faixaD(d)] as PrioridadeDeAcao;
}

// ---------------------------------------------------------------- FMEA de processo

export const CLASSIFICACOES_ESPECIAIS = {
  CC: 'Característica crítica (CC)',
  SC: 'Característica significativa (SC)',
} as const;
export type ClassificacaoEspecial = keyof typeof CLASSIFICACOES_ESPECIAIS;

export const STATUS_DA_ACAO_FMEA = {
  aberta: 'Aberta',
  concluida: 'Concluída',
} as const;

const linhaDoFmea = z
  .object({
    etapa: texto('a etapa do processo', 150, 2),
    funcao: texto('a função ou requisito', 300, 2),
    modoDeFalha: texto('o modo de falha', 300, 2),
    efeito: texto('o efeito da falha', 300, 2),
    severidade: nota('a severidade'),
    classificacao: enumOpcional(
      CLASSIFICACOES_ESPECIAIS,
      'Classificação desconhecida.',
    ),
    causa: texto('a causa', 300, 2),
    prevencao: textoOpcional(300),
    ocorrencia: nota('a ocorrência'),
    deteccao: textoOpcional(300),
    notaDeteccao: nota('a detecção'),
    acao: textoOpcional(500),
    responsavel: textoOpcional(120),
    prazo: opcional(data('o prazo da ação')),
    statusAcao: z.enum(chaves(STATUS_DA_ACAO_FMEA)).default('aberta'),
  })
  .superRefine((l, ctx) => {
    if (prioridadeDeAcao(l.severidade, l.ocorrencia, l.notaDeteccao) !== 'H')
      return;
    for (const [campo, msg] of [
      ['acao', 'AP alta: informe a ação (ou a justificativa de não agir).'],
      ['responsavel', 'AP alta: informe o responsável.'],
      ['prazo', 'AP alta: informe o prazo.'],
    ] as const)
      if (!l[campo])
        ctx.addIssue({ code: 'custom', path: [campo], message: msg });
  });
export type LinhaDoFmeaEntrada = z.input<typeof linhaDoFmea>;

const camposDoFmea = {
  titulo: texto('o título do FMEA', 150, 3),
  item: texto('a peça ou processo analisado', 150, 2),
  cliente: textoOpcional(150),
  equipe: textoOpcional(300),
  revisao: textoOpcional(20),
  linhas: z
    .array(linhaDoFmea)
    .max(300, 'No máximo 300 linhas por FMEA.')
    .default([]),
};
export const novoFmeaSchema = z.object(camposDoFmea);
export type NovoFmea = z.input<typeof novoFmeaSchema>;
export const atualizarFmeaSchema = z.object({ ...camposDoFmea, versao });

export interface LinhaDoFmea {
  etapa: string;
  funcao: string;
  modoDeFalha: string;
  efeito: string;
  severidade: number;
  classificacao: ClassificacaoEspecial | null;
  causa: string;
  prevencao: string | null;
  ocorrencia: number;
  deteccao: string | null;
  notaDeteccao: number;
  acao: string | null;
  responsavel: string | null;
  prazo: string | null;
  statusAcao: keyof typeof STATUS_DA_ACAO_FMEA;
  /** Calculado. */
  ap: PrioridadeDeAcao;
  /** S × O × D, só como referência (o critério é a AP). */
  npr: number;
}

export interface Fmea {
  id: string;
  numero: string;
  titulo: string;
  item: string;
  cliente: string | null;
  equipe: string | null;
  revisao: string | null;
  linhas: LinhaDoFmea[];
  contagem: Record<PrioridadeDeAcao, number>;
  /** Ações de AP alta ainda abertas. */
  acoesAltasAbertas: number;
  atualizadoEm: string;
  versao: string;
}
export type FmeaResumo = Omit<Fmea, 'linhas'>;

// ---------------------------------------------------------------- plano de controle

export const FASES_DO_PLANO_DE_CONTROLE = {
  prototipo: 'Protótipo',
  pre_lancamento: 'Pré-lançamento',
  producao: 'Produção',
} as const;
export type FaseDoPlanoDeControle = keyof typeof FASES_DO_PLANO_DE_CONTROLE;

export const TIPOS_DE_CARACTERISTICA = {
  produto: 'Produto',
  processo: 'Processo',
} as const;

const linhaDoPlano = z.object({
  etapa: texto('a etapa do processo', 150, 2),
  maquina: curto(150),
  caracteristica: texto('a característica', 200, 2),
  tipo: z.enum(chaves(TIPOS_DE_CARACTERISTICA), {
    error: 'Escolha produto ou processo.',
  }),
  classificacao: enumOpcional(
    CLASSIFICACOES_ESPECIAIS,
    'Classificação desconhecida.',
  ),
  especificacao: texto('a especificação ou tolerância', 200, 1),
  metodo: texto('o método de avaliação ou medição', 200, 2),
  amostra: texto('o tamanho da amostra', 60, 1),
  frequencia: texto('a frequência', 60, 1),
  controle: texto('o método de controle', 200, 2),
  reacao: texto('o plano de reação', 300, 2),
});

const camposDoPlanoDeControle = {
  titulo: texto('o título do plano', 150, 3),
  item: texto('a peça ou família', 150, 2),
  fase: z.enum(chaves(FASES_DO_PLANO_DE_CONTROLE), {
    error: 'Escolha a fase.',
  }),
  revisao: textoOpcional(20),
  /** FMEA de origem: sem linhas, as linhas são geradas a partir dele. */
  fmeaId: opcional(z.uuid('FMEA inválido.')),
  linhas: z.array(linhaDoPlano).max(300, 'No máximo 300 linhas.').default([]),
};
export const novoPlanoDeControleSchema = z.object(camposDoPlanoDeControle);
export type NovoPlanoDeControle = z.input<typeof novoPlanoDeControleSchema>;
export const atualizarPlanoDeControleSchema = z.object({
  ...camposDoPlanoDeControle,
  versao,
});
export type LinhaDoPlanoDeControle = z.output<typeof linhaDoPlano>;

export interface PlanoDeControle {
  id: string;
  numero: string;
  titulo: string;
  item: string;
  fase: FaseDoPlanoDeControle;
  revisao: string | null;
  fmeaId: string | null;
  fmeaNumero: string | null;
  linhas: (Omit<LinhaDoPlanoDeControle, 'classificacao'> & {
    classificacao: ClassificacaoEspecial | null;
  })[];
  atualizadoEm: string;
  versao: string;
}
export type PlanoDeControleResumo = Omit<PlanoDeControle, 'linhas'> & {
  totalDeLinhas: number;
};

// ---------------------------------------------------------------- PPAP

/** Os 18 elementos do PPAP (AIAG, 4ª edição). */
export const ELEMENTOS_DO_PPAP = {
  registros_de_projeto: 'Registros de projeto',
  alteracoes_de_engenharia: 'Documentos de alteração de engenharia',
  aprovacao_de_engenharia: 'Aprovação de engenharia do cliente',
  dfmea: 'FMEA de projeto (DFMEA)',
  fluxograma: 'Fluxograma do processo',
  pfmea: 'FMEA de processo (PFMEA)',
  plano_de_controle: 'Plano de controle',
  msa: 'Análise do sistema de medição (MSA)',
  dimensional: 'Resultados dimensionais',
  material_desempenho: 'Resultados de ensaios de material e desempenho',
  estudos_iniciais: 'Estudos iniciais do processo (capabilidade)',
  laboratorio: 'Documentação de laboratório qualificado',
  aparencia: 'Relatório de aprovação de aparência (AAR)',
  amostras: 'Peças de amostra da produção',
  amostra_padrao: 'Amostra padrão',
  dispositivos: 'Auxílios de verificação (dispositivos)',
  requisitos_do_cliente: 'Registros de requisitos específicos do cliente',
  psw: 'Certificado de submissão de peça (PSW)',
} as const;
export type ElementoDoPpap = keyof typeof ELEMENTOS_DO_PPAP;

export const NIVEIS_DO_PPAP = {
  1: 'Nível 1: só o PSW (e AAR, quando houver aparência)',
  2: 'Nível 2: PSW com amostras e dados de suporte limitados',
  3: 'Nível 3: PSW com amostras e dados de suporte completos',
  4: 'Nível 4: PSW e o que o cliente definir',
  5: 'Nível 5: PSW com amostras e dados completos revistos na planta',
} as const;
export type NivelDoPpap = 1 | 2 | 3 | 4 | 5;

/**
 * Tabela de retenção e submissão (AIAG PPAP 4ª ed.): S = submeter ao cliente e reter; R = reter e deixar
 * disponível; * = reter e submeter se o cliente pedir (nível 4). Ordem dos níveis: 1 a 5.
 */
const RETENCAO: Record<ElementoDoPpap, string> = {
  registros_de_projeto: 'RSS*R',
  alteracoes_de_engenharia: 'RSS*R',
  aprovacao_de_engenharia: 'RRS*R',
  dfmea: 'RRS*R',
  fluxograma: 'RRS*R',
  pfmea: 'RRS*R',
  plano_de_controle: 'RRS*R',
  msa: 'RRS*R',
  dimensional: 'RSS*R',
  material_desempenho: 'RSS*R',
  estudos_iniciais: 'RRS*R',
  laboratorio: 'RSS*R',
  aparencia: 'SSS*R',
  amostras: 'RSS*R',
  amostra_padrao: 'RRR*R',
  dispositivos: 'RRR*R',
  requisitos_do_cliente: 'RRS*R',
  psw: 'SSSSS',
};
export type ExigenciaDoElemento = 'submeter' | 'reter' | 'a_pedido';
export function exigenciaDoElemento(
  e: ElementoDoPpap,
  nivel: NivelDoPpap,
): ExigenciaDoElemento {
  const c = RETENCAO[e][nivel - 1];
  return c === 'S' ? 'submeter' : c === '*' ? 'a_pedido' : 'reter';
}

export const STATUS_DO_ELEMENTO = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  nao_aplicavel: 'Não aplicável',
} as const;
export type StatusDoElemento = keyof typeof STATUS_DO_ELEMENTO;

export const MOTIVOS_DO_PPAP = {
  nova_peca: 'Peça nova',
  alteracao_engenharia: 'Alteração de engenharia',
  ferramental: 'Ferramental novo, transferido ou reformado',
  correcao: 'Correção de discrepância',
  material_fornecedor: 'Mudança de material ou de subfornecedor',
  processo: 'Mudança no processo ou no local de fabricação',
  outro: 'Outro',
} as const;

export const STATUS_DO_PPAP = {
  em_preparacao: 'Em preparação',
  submetido: 'Submetido',
  aprovado: 'Aprovado',
  aprovacao_provisoria: 'Aprovação provisória',
  rejeitado: 'Rejeitado',
} as const;
export type StatusDoPpap = keyof typeof STATUS_DO_PPAP;

const nivel = z.coerce
  .number({ error: 'Escolha o nível de submissão.' })
  .int()
  .refine(
    (n): n is NivelDoPpap => n >= 1 && n <= 5,
    'Escolha o nível de submissão (1 a 5).',
  );

const camposDoPpap = {
  peca: texto('o nome da peça', 150, 2),
  numeroDaPeca: texto('o número da peça', 60, 1),
  revisaoDoDesenho: textoOpcional(20),
  cliente: texto('o cliente', 150, 2),
  nivel,
  motivo: z.enum(chaves(MOTIVOS_DO_PPAP), {
    error: 'Escolha o motivo da submissão.',
  }),
  fmeaId: opcional(z.uuid('FMEA inválido.')),
  planoDeControleId: opcional(z.uuid('Plano de controle inválido.')),
};
export const novoPpapSchema = z.object(camposDoPpap);
export type NovoPpap = z.input<typeof novoPpapSchema>;
export const atualizarPpapSchema = z.object({
  ...camposDoPpap,
  versao,
  /** Só os elementos enviados mudam; os outros ficam como estavam. */
  elementos: z
    .partialRecord(
      z.enum(chaves(ELEMENTOS_DO_PPAP)),
      z.object({
        status: z.enum(chaves(STATUS_DO_ELEMENTO)),
        observacao: curto(300),
      }),
    )
    .optional(),
});
export const submeterPpapSchema = z.object({
  versao,
  data: data('a data de submissão'),
});
export const decidirPpapSchema = z.object({
  versao,
  decisao: z.enum(['aprovado', 'aprovacao_provisoria', 'rejeitado'], {
    error: 'Escolha a decisão do cliente.',
  }),
  parecer: texto('o parecer do cliente', 1000, 3),
});

export interface ElementoDoPpapNoRegistro {
  elemento: ElementoDoPpap;
  exigencia: ExigenciaDoElemento;
  status: StatusDoElemento;
  observacao: string;
}

export interface Ppap {
  id: string;
  numero: string;
  peca: string;
  numeroDaPeca: string;
  revisaoDoDesenho: string | null;
  cliente: string;
  nivel: NivelDoPpap;
  motivo: keyof typeof MOTIVOS_DO_PPAP;
  fmeaId: string | null;
  planoDeControleId: string | null;
  elementos: ElementoDoPpapNoRegistro[];
  /** Elementos a submeter ainda não concluídos (nem não aplicáveis). */
  pendentesParaSubmeter: number;
  status: StatusDoPpap;
  submetidoEm: string | null;
  parecer: string | null;
  decididoEm: string | null;
  atualizadoEm: string;
  versao: string;
}
export type PpapResumo = Omit<Ppap, 'elementos'>;

/** Pode submeter: todo elemento "submeter" concluído ou não aplicável com justificativa. */
export function pendenciasDoPpap(
  elementos: ElementoDoPpapNoRegistro[],
): ElementoDoPpapNoRegistro[] {
  return elementos.filter(
    (e) =>
      e.exigencia === 'submeter' &&
      !(
        e.status === 'concluido' ||
        (e.status === 'nao_aplicavel' && e.observacao.trim())
      ),
  );
}
