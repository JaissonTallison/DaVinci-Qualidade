/**
 * Terceiros: empresas que prestam serviço dentro da empresa e os documentos de SST exigidos delas (serviço seguranca).
 * docs/05-modulos/terceiros.md
 */
import { z } from 'zod';
import { cnpjValido, normalizarDocumento } from './documento.js';
import { chaves, data, opcional, texto, textoOpcional } from './validadores.js';

export const TIPOS_DOC_TERCEIRO = {
  pgr: 'PGR',
  pcmso: 'PCMSO',
  aso: 'ASO dos trabalhadores',
  treinamentos: 'Certificados de treinamento (NRs)',
  ficha_epi: 'Fichas de entrega de EPI',
  seguro: 'Seguro de vida',
  outros: 'Outro documento',
} as const;
export type TipoDocTerceiro = keyof typeof TIPOS_DOC_TERCEIRO;

/** Sem estes três válidos, a terceira não entra para trabalhar. */
export const DOCS_OBRIGATORIOS_TERCEIRO: TipoDocTerceiro[] = [
  'pgr',
  'pcmso',
  'aso',
];

export const SITUACOES_TERCEIRO = {
  liberada: 'Liberada',
  pendente: 'Com pendência',
  contrato_encerrado: 'Contrato encerrado',
} as const;
export type SituacaoTerceiro = keyof typeof SITUACOES_TERCEIRO;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const camposDoTerceiro = {
  razaoSocial: texto('a razão social', 150, 3),
  cnpj: z
    .string({ error: 'Informe o CNPJ.' })
    .transform(normalizarDocumento)
    .pipe(
      z
        .string()
        .length(14, 'O CNPJ tem 14 dígitos.')
        .refine(cnpjValido, 'CNPJ inválido: confira os dígitos.'),
    ),
  servico: texto('o serviço prestado', 200, 3),
  contato: textoOpcional(120),
  inicioContrato: data('o início do contrato'),
  fimContrato: opcional(data('o fim do contrato')),
};
const contratoCoerente = (t: {
  inicioContrato: string;
  fimContrato: string | null;
}) => !t.fimContrato || t.fimContrato >= t.inicioContrato;
const erroDoContrato = {
  path: ['fimContrato'],
  message: 'O fim do contrato vem depois do início.',
};

export const novoTerceiroSchema = z
  .object(camposDoTerceiro)
  .refine(contratoCoerente, erroDoContrato);
export type NovoTerceiro = z.input<typeof novoTerceiroSchema>;
export const atualizarTerceiroSchema = z
  .object({ ...camposDoTerceiro, versao })
  .refine(contratoCoerente, erroDoContrato);

/** Documento novo do mesmo tipo substitui o anterior (vale o de validade mais longa). */
export const registrarDocTerceiroSchema = z.object({
  tipo: z.enum(chaves(TIPOS_DOC_TERCEIRO), {
    error: 'Escolha o tipo de documento.',
  }),
  descricao: textoOpcional(150),
  validade: data('a validade'),
});
export type RegistrarDocTerceiro = z.input<typeof registrarDocTerceiroSchema>;

export const filtroTerceirosSchema = z.object({
  situacao: opcional(
    z.enum(chaves(SITUACOES_TERCEIRO), { error: 'Situação desconhecida.' }),
  ),
  busca: opcional(z.string().trim().max(100)),
});

export interface DocumentoTerceiro {
  id: string;
  tipo: TipoDocTerceiro;
  descricao: string | null;
  validade: string;
  registradoEm: string;
}

export interface TerceiroResumo {
  id: string;
  razaoSocial: string;
  cnpj: string;
  servico: string;
  fimContrato: string | null;
  situacao: SituacaoTerceiro;
  /** O que impede a liberação: "PGR vencido em 10/09/2026", "PCMSO não enviado". */
  pendencias: string[];
}

export interface Terceiro extends TerceiroResumo {
  contato: string | null;
  inicioContrato: string;
  /** O vigente de cada tipo primeiro; os substituídos ficam como histórico. */
  documentos: (DocumentoTerceiro & { vigente: boolean })[];
  versao: string;
}

export interface ResumoTerceiros {
  liberadas: number;
  comPendencia: number;
  /** Documentos vigentes que vencem em até 30 dias, de terceiras com contrato ativo. */
  documentosVencendo: number;
}
