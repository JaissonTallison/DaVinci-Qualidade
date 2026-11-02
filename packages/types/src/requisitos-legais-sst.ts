/**
 * Requisitos legais de SST: registro das normas aplicáveis (NR-01, NR-06, NR-07…) e a avaliação
 * de atendimento. Não guarda o texto da lei — guarda o que ela exige e como a empresa atende.
 * Serviço seguranca. Atende ISO 45001 6.1.3 / 9.1.2 e NR-01 1.5.4.4.6 (mudança de requisito legal).
 */
import { z } from 'zod';
import {
  ATENDIMENTOS,
  ESFERAS,
  type Atendimento,
  type Esfera,
} from './ambiental.js';
import {
  chaves,
  data,
  enumOpcional,
  texto,
  textoOpcional,
} from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

/** Cada requisito é reavaliado ao menos uma vez por ano (ISO 45001, 9.1.2). */
export const MESES_ENTRE_AVALIACOES_SST = 12;

const camposRequisitoSst = {
  norma: texto('a norma (ex.: NR-06 — Equipamento de Proteção Individual)', 200, 3),
  esfera: z.enum(chaves(ESFERAS), { error: 'Escolha a esfera.' }),
  tema: texto('o tema', 100, 2),
  requisito: texto('o que ela exige da empresa', 1000, 10),
};
export const novoRequisitoSstSchema = z.object(camposRequisitoSst);
export type NovoRequisitoSst = z.input<typeof novoRequisitoSstSchema>;
export const atualizarRequisitoSstSchema = z.object({
  ...camposRequisitoSst,
  versao,
});
/** Avaliação de atendimento: o que foi verificado e quando. "Não atende" e "em parte" pedem a ação. */
export const avaliarRequisitoSstSchema = z
  .object({
    versao,
    data: data('a data da avaliação'),
    atendimento: z.enum(['atende', 'parcial', 'nao_atende'], {
      error: 'Escolha o resultado.',
    }),
    evidencia: texto('a evidência verificada', 500, 5),
    acao: textoOpcional(500),
  })
  .refine((a) => a.atendimento === 'atende' || a.acao, {
    path: ['acao'],
    message: 'Informe a ação para passar a atender.',
  });
export const filtroRequisitosSstSchema = z.object({
  atendimento: enumOpcional(ATENDIMENTOS, 'Atendimento desconhecido.'),
});

export interface RequisitoLegalSst {
  id: string;
  norma: string;
  esfera: Esfera;
  tema: string;
  requisito: string;
  atendimento: Atendimento;
  ultimaAvaliacao: string | null;
  proximaAvaliacao: string | null;
  avaliacaoVencida: boolean;
  evidencia: string | null;
  acao: string | null;
  versao: string;
}
