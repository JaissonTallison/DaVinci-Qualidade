/**
 * Agenda ESG (serviço esg): temas com catálogo de referência, dupla materialidade, ODS e meta por tema material.
 * Os temas do catálogo vêm do material de domínio; notas e regras são decisões nossas (decisão Q9). docs/05-modulos/esg.md
 */
import { z } from 'zod';
import { chaves, data, opcional, texto, textoOpcional } from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

export const PILARES = {
  ambiental: 'Ambiental',
  social: 'Social',
  governanca: 'Governança',
} as const;
export type Pilar = keyof typeof PILARES;

/** Os 17 Objetivos de Desenvolvimento Sustentável da ONU (as cores oficiais ficam nos tokens `ods-1` a `ods-17`). */
export const ODS: Record<number, string> = {
  1: 'Erradicação da pobreza',
  2: 'Fome zero e agricultura sustentável',
  3: 'Saúde e bem-estar',
  4: 'Educação de qualidade',
  5: 'Igualdade de gênero',
  6: 'Água potável e saneamento',
  7: 'Energia limpa e acessível',
  8: 'Trabalho decente e crescimento econômico',
  9: 'Indústria, inovação e infraestrutura',
  10: 'Redução das desigualdades',
  11: 'Cidades e comunidades sustentáveis',
  12: 'Consumo e produção responsáveis',
  13: 'Ação contra a mudança global do clima',
  14: 'Vida na água',
  15: 'Vida terrestre',
  16: 'Paz, justiça e instituições eficazes',
  17: 'Parcerias e meios de implementação',
};
export const NUMEROS_ODS = Array.from({ length: 17 }, (_, i) => i + 1);

/**
 * Catálogo de referência: os temas da Agenda ESG do material de domínio (E, S e G), com os subtemas na descrição.
 * Os ODS sugeridos para cada tema são decisão nossa. A empresa importa e depois ajusta, avalia ou inativa.
 */
export const CATALOGO_ESG: {
  codigo: string;
  nome: string;
  pilar: Pilar;
  descricao: string;
  ods: number[];
}[] = [
  {
    codigo: 'E1',
    nome: 'Mudanças climáticas',
    pilar: 'ambiental',
    descricao:
      'Mitigação de emissões de gases de efeito estufa (GEE); adaptação às mudanças climáticas; eficiência energética.',
    ods: [13, 7],
  },
  {
    codigo: 'E2',
    nome: 'Recursos hídricos',
    pilar: 'ambiental',
    descricao: 'Uso da água; gestão de efluentes.',
    ods: [6, 14],
  },
  {
    codigo: 'E3',
    nome: 'Biodiversidade e serviços ecossistêmicos',
    pilar: 'ambiental',
    descricao: 'Conservação e uso sustentável da biodiversidade.',
    ods: [15, 14],
  },
  {
    codigo: 'E4',
    nome: 'Economia circular e gestão de resíduos',
    pilar: 'ambiental',
    descricao: 'Economia circular; gestão de resíduos.',
    ods: [12, 11],
  },
  {
    codigo: 'E5',
    nome: 'Gestão ambiental e prevenção da poluição',
    pilar: 'ambiental',
    descricao:
      'Gestão ambiental e da qualidade; qualidade do ar (emissão de poluentes).',
    ods: [3, 12],
  },
  {
    codigo: 'S1',
    nome: 'Diálogo social e desenvolvimento territorial',
    pilar: 'social',
    descricao:
      'Investimento social privado; diálogo e engajamento das partes interessadas.',
    ods: [11, 1, 17],
  },
  {
    codigo: 'S2',
    nome: 'Direitos humanos',
    pilar: 'social',
    descricao:
      'Respeito aos direitos humanos; combate ao trabalho forçado e ao trabalho infantil.',
    ods: [8, 16],
  },
  {
    codigo: 'S3',
    nome: 'Diversidade, equidade e inclusão',
    pilar: 'social',
    descricao:
      'Políticas e práticas de diversidade e equidade; cultura e ética corporativa para promoção de inclusão.',
    ods: [5, 10],
  },
  {
    codigo: 'S4',
    nome: 'Relações e práticas de trabalho',
    pilar: 'social',
    descricao:
      'Desenvolvimento profissional continuado; qualidade de vida: saúde e segurança ocupacional; política de remuneração e benefícios, gestão de KPIs.',
    ods: [3, 4, 8],
  },
  {
    codigo: 'S5',
    nome: 'Promoção de responsabilidade social na cadeia de valor',
    pilar: 'social',
    descricao:
      'Relacionamento com consumidores e clientes; relacionamento com os fornecedores; relacionamento e vínculos com a sociedade.',
    ods: [12, 8, 17],
  },
  {
    codigo: 'G1',
    nome: 'Governança corporativa',
    pilar: 'governanca',
    descricao:
      'Estrutura e composição da governança corporativa; propósito e estratégia em relação à sustentabilidade.',
    ods: [16, 17],
  },
  {
    codigo: 'G2',
    nome: 'Conduta empresarial',
    pilar: 'governanca',
    descricao:
      'Compliance, programa de integridade e práticas anticorrupção; práticas de combate à concorrência desleal (antitruste); engajamento das partes interessadas.',
    ods: [16],
  },
  {
    codigo: 'G3',
    nome: 'Práticas de controle e gestão',
    pilar: 'governanca',
    descricao:
      'Gestão de riscos do negócio; controles internos; auditorias interna e externa; ambiente legal e regulatório; gestão da segurança da informação; privacidade de dados pessoais e cumprimento da LGPD.',
    ods: [16, 9],
  },
  {
    codigo: 'G4',
    nome: 'Transparência na gestão',
    pilar: 'governanca',
    descricao:
      'Responsabilização (prestação de contas); relatórios ESG e de sustentabilidade.',
    ods: [16, 17],
  },
];

// ---------------------------------------------------------------- materialidade

export const NIVEIS_DE_MATERIALIDADE = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
} as const;
export type NivelDeMaterialidade = keyof typeof NIVEIS_DE_MATERIALIDADE;
/** A partir desta nota o tema é material e pede meta (interface.md §5.4: alto ≥ 15). */
export const NOTA_MATERIAL = 15;

/** Dupla materialidade: impacto da empresa no mundo × relevância do tema para o negócio e as partes interessadas. */
export function notaDeMaterialidade(
  impacto: number,
  relevancia: number,
): number {
  return impacto * relevancia;
}
export function nivelDeMaterialidade(nota: number): NivelDeMaterialidade {
  return nota < 6 ? 'baixa' : nota < NOTA_MATERIAL ? 'media' : 'alta';
}

const nota = (rotulo: string) =>
  opcional(
    z.coerce
      .number({ error: `Escolha ${rotulo}.` })
      .int()
      .min(1, `Escolha ${rotulo}.`)
      .max(5, `Escolha ${rotulo}.`),
  );

const camposTema = {
  nome: texto('o nome do tema', 150, 3),
  pilar: z.enum(chaves(PILARES), { error: 'Escolha o pilar.' }),
  descricao: textoOpcional(500),
  ods: z.array(z.coerce.number().int().min(1).max(17)).max(17).default([]),
  impacto: nota('o impacto'),
  relevancia: nota('a relevância'),
  responsavel: textoOpcional(120),
  meta: textoOpcional(300),
  prazoMeta: opcional(data('o prazo da meta')),
};
type ComMeta = {
  impacto?: number | null;
  relevancia?: number | null;
  responsavel?: string | null;
  meta?: string | null;
  prazoMeta?: string | null;
};
/** Avaliado com uma nota só não vale; tema material exige responsável, meta e prazo. */
const regrasDoTema = (t: ComMeta, ctx: z.RefinementCtx) => {
  if ((t.impacto == null) !== (t.relevancia == null))
    ctx.addIssue({
      code: 'custom',
      path: [t.impacto == null ? 'impacto' : 'relevancia'],
      message:
        'Avalie impacto e relevância juntos (ou deixe os dois em branco).',
    });
  if (t.impacto == null || t.relevancia == null) return;
  if (notaDeMaterialidade(t.impacto, t.relevancia) < NOTA_MATERIAL) return;
  for (const [campo, mensagem] of [
    ['responsavel', 'Tema material: informe o responsável.'],
    ['meta', 'Tema material: informe a meta (o que, quanto e até quando).'],
    ['prazoMeta', 'Tema material: informe o prazo da meta.'],
  ] as const)
    if (!t[campo])
      ctx.addIssue({ code: 'custom', path: [campo], message: mensagem });
};
export const novoTemaSchema = z.object(camposTema).superRefine(regrasDoTema);
export type NovoTema = z.input<typeof novoTemaSchema>;
export const atualizarTemaSchema = z
  .object({ ...camposTema, versao })
  .superRefine(regrasDoTema);
export const situacaoDoTemaSchema = z.object({ versao, ativo: z.boolean() });
export const filtroTemasSchema = z.object({
  pilar: opcional(z.enum(chaves(PILARES))),
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
});
/** Andamento da meta: percentual atingido e o que foi feito. */
export const registrarAndamentoSchema = z.object({
  data: data('a data'),
  progresso: z.coerce
    .number({ error: 'Informe o percentual atingido.' })
    .int('Use um número inteiro.')
    .min(0, 'Entre 0 e 100.')
    .max(100, 'Entre 0 e 100.'),
  comentario: texto('o que foi feito', 500, 5),
});

export interface Andamento {
  id: string;
  data: string;
  progresso: number;
  comentario: string;
}

export interface TemaEsg {
  id: string;
  codigoCatalogo: string | null;
  nome: string;
  pilar: Pilar;
  descricao: string | null;
  ods: number[];
  impacto: number | null;
  relevancia: number | null;
  /** null enquanto não avaliado. */
  nota: number | null;
  nivel: NivelDeMaterialidade | null;
  material: boolean;
  responsavel: string | null;
  meta: string | null;
  prazoMeta: string | null;
  /** Último percentual registrado (0 sem andamento). */
  progresso: number;
  /** Tema material ativo com prazo passado e meta abaixo de 100%. */
  metaAtrasada: boolean;
  ativo: boolean;
  versao: string;
  /** Só no detalhe, do mais recente para o mais antigo. */
  andamentos?: Andamento[];
}

export interface ResultadoDaImportacao {
  criados: number;
  jaExistiam: number;
}

export interface ResumoEsg {
  temas: number;
  semAvaliacao: number;
  materiais: number;
  metasAtrasadas: number;
  /** ODS com ao menos um tema material ligado. */
  odsComTemaMaterial: number;
}

/** Pilares do conceito de sustentabilidade da Agenda ESG, com a governança corporativa como base (material de domínio). */
export const PILARES_DA_SUSTENTABILIDADE = [
  'Ambiental',
  'Social',
  'Econômica',
  'Cultural',
  'Ética',
] as const;
