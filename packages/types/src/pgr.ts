/**
 * PGR: inventário de riscos ocupacionais com avaliação e plano de ação (NR-1, GRO). Serviço seguranca. docs/05-modulos/pgr.md
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

export const GRUPOS_DE_RISCO = {
  fisico: 'Físico',
  quimico: 'Químico',
  biologico: 'Biológico',
  ergonomico: 'Ergonômico',
  acidente: 'Acidente (mecânico)',
} as const;
export type GrupoDeRisco = keyof typeof GRUPOS_DE_RISCO;

export const SEVERIDADES = {
  1: 'Leve',
  2: 'Moderada',
  3: 'Grave',
  4: 'Gravíssima',
} as const;
export const PROBABILIDADES = {
  1: 'Rara',
  2: 'Possível',
  3: 'Provável',
  4: 'Quase certa',
} as const;

export const NIVEIS_DE_RISCO = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
} as const;
export type NivelDeRisco = keyof typeof NIVEIS_DE_RISCO;

/** Matriz 4×4: severidade × probabilidade. 1–3 baixo, 4–6 moderado, 8–9 alto, 12–16 crítico. */
export function nivelDoRisco(
  severidade: number,
  probabilidade: number,
): NivelDeRisco {
  const p = severidade * probabilidade;
  return p <= 3 ? 'baixo' : p <= 6 ? 'moderado' : p <= 9 ? 'alto' : 'critico';
}

const escala = (rotulo: string) =>
  z.coerce
    .number({ error: `Escolha a ${rotulo}.` })
    .int()
    .min(1, `Escolha a ${rotulo}.`)
    .max(4, `Escolha a ${rotulo}.`);
const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const camposDoRisco = {
  grupo: z.enum(chaves(GRUPOS_DE_RISCO), {
    error: 'Escolha o grupo do risco.',
  }),
  local: texto('o setor ou a atividade', 120, 3),
  perigo: texto('o perigo (fonte ou situação)', 200, 3),
  danos: texto('os possíveis danos à saúde', 300, 3),
  severidade: escala('severidade'),
  probabilidade: escala('probabilidade'),
  controles: textoOpcional(1000),
  acoes: textoOpcional(1000),
  responsavel: textoOpcional(120),
  prazo: opcional(data('o prazo das ações')),
};
/** Risco alto ou crítico exige plano: o que fazer, quem e até quando. */
type ComPlano = {
  severidade: number;
  probabilidade: number;
  acoes: string | null;
  responsavel: string | null;
  prazo: string | null;
};
const comPlano = (r: ComPlano, ctx: z.RefinementCtx) => {
  const nivel = nivelDoRisco(r.severidade, r.probabilidade);
  if (nivel !== 'alto' && nivel !== 'critico') return;
  const msg = `Risco ${NIVEIS_DE_RISCO[nivel].toLowerCase()}: informe`;
  if (!r.acoes)
    ctx.addIssue({
      code: 'custom',
      path: ['acoes'],
      message: `${msg} as medidas a implementar.`,
    });
  if (!r.responsavel)
    ctx.addIssue({
      code: 'custom',
      path: ['responsavel'],
      message: `${msg} o responsável.`,
    });
  if (!r.prazo)
    ctx.addIssue({
      code: 'custom',
      path: ['prazo'],
      message: `${msg} o prazo.`,
    });
};
export const novoRiscoSchema = z.object(camposDoRisco).superRefine(comPlano);
export type NovoRisco = z.input<typeof novoRiscoSchema>;
export const atualizarRiscoSchema = z
  .object({ ...camposDoRisco, versao })
  .superRefine(comPlano);
export const situacaoDoRiscoSchema = z.object({
  versao,
  ativo: z.boolean({ error: 'Informe se fica ativo.' }),
});

export const filtroRiscosSchema = z.object({
  grupo: enumOpcional(GRUPOS_DE_RISCO, 'Grupo desconhecido.'),
  nivel: enumOpcional(NIVEIS_DE_RISCO, 'Nível desconhecido.'),
  busca: opcional(z.string().trim().max(100)),
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
});

export interface Risco {
  id: string;
  grupo: GrupoDeRisco;
  local: string;
  perigo: string;
  danos: string;
  severidade: number;
  probabilidade: number;
  nivel: NivelDeRisco;
  controles: string | null;
  acoes: string | null;
  responsavel: string | null;
  prazo: string | null;
  /** Prazo passou e o risco segue alto ou crítico. */
  acaoVencida: boolean;
  ativo: boolean;
  /** Agente nocivo e avaliação para o S-2240. */
  dadosEsocial: import('./esocial.js').DadosEsocialDoRisco | null;
  /** Última revisão (alteração) do risco. */
  revisadoEm: string;
  versao: string;
}

export interface ResumoPgr {
  criticos: number;
  altos: number;
  acoesVencidas: number;
}
