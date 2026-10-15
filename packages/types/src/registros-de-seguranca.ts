/**
 * Registros de segurança: DDS, APR, reunião da CIPA e simulado de emergência (serviço seguranca).
 * docs/05-modulos/registros-de-seguranca.md
 */
import { z } from 'zod';
import {
  chaves,
  data,
  enumOpcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const TIPOS_REGISTRO_SST = {
  dds: {
    rotulo: 'DDS (diálogo diário de segurança)',
    conteudo: 'Assuntos tratados',
  },
  apr: {
    rotulo: 'APR (análise preliminar de risco)',
    conteudo: 'Etapas, riscos e medidas de controle',
  },
  reuniao_cipa: {
    rotulo: 'Reunião da CIPA',
    conteudo: 'Pauta e deliberações (ata)',
  },
  simulado: {
    rotulo: 'Simulado de emergência',
    conteudo: 'Cenário, tempo de resposta e falhas encontradas',
  },
} as const;
export type TipoRegistroSst = keyof typeof TIPOS_REGISTRO_SST;
const ROTULOS = Object.fromEntries(
  Object.entries(TIPOS_REGISTRO_SST).map(([k, v]) => [k, v.rotulo]),
) as Record<TipoRegistroSst, string>;
export const ROTULOS_REGISTRO_SST = ROTULOS;

export const novoRegistroSstSchema = z.object({
  tipo: z.enum(chaves(ROTULOS), { error: 'Escolha o tipo de registro.' }),
  data: data('a data'),
  tema: texto('o tema ou a atividade', 200, 3),
  local: textoOpcional(120),
  responsavel: texto('quem conduziu', 120, 3),
  participantes: z.coerce
    .number({ error: 'Informe quantas pessoas participaram.' })
    .int('Use um número inteiro.')
    .min(1, 'Ao menos 1 participante.')
    .max(5000),
  conteudo: texto('o conteúdo', 4000, 10),
});
export type NovoRegistroSst = z.input<typeof novoRegistroSstSchema>;
export const anularRegistroSstSchema = z.object({
  motivo: texto('o motivo da anulação', 300, 10),
});

export const filtroRegistrosSstSchema = z.object({
  tipo: enumOpcional(ROTULOS, 'Tipo desconhecido.'),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce
    .number()
    .int()
    .refine(
      (v) => v === 25 || v === 50 || v === 100,
      'Use 25, 50 ou 100 por página.',
    )
    .default(50),
});

export interface RegistroSst {
  id: string;
  tipo: TipoRegistroSst;
  data: string;
  tema: string;
  local: string | null;
  responsavel: string;
  participantes: number;
  conteudo: string;
  motivoAnulacao: string | null;
}

export interface ResumoRegistrosSst {
  ddsNoMes: number;
  /** Data da última reunião da CIPA (a NR-5 pede reunião ordinária mensal). */
  ultimaReuniaoCipa: string | null;
  cipaEmDia: boolean;
  /** Data do último simulado (um por ano, no mínimo). */
  ultimoSimulado: string | null;
  simuladoEmDia: boolean;
}
