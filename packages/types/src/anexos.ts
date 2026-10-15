/**
 * Anexos e evidências (serviço plataforma): arquivos ligados a um registro de outro módulo. docs/05-modulos/anexos.md
 */
import { z } from 'zod';
import type { Permissao } from './permissoes.js';
import { chaves, textoOpcional } from './validadores.js';

/** Registros que aceitam anexo e o módulo que decide quem vê e quem anexa. */
export const REGISTROS_COM_ANEXO = {
  nao_conformidade: { rotulo: 'Não conformidade', modulo: 'qualidade' },
  plano_de_acao: { rotulo: 'Plano de ação', modulo: 'qualidade' },
  inspecao: { rotulo: 'Inspeção', modulo: 'qualidade' },
  instrumento: { rotulo: 'Instrumento', modulo: 'qualidade' },
  auditoria: { rotulo: 'Auditoria', modulo: 'auditorias' },
  acidente: { rotulo: 'Acidente', modulo: 'seguranca' },
  permissao_de_trabalho: {
    rotulo: 'Permissão de trabalho',
    modulo: 'seguranca',
  },
  registro_sst: { rotulo: 'Registro de segurança', modulo: 'seguranca' },
  terceiro: { rotulo: 'Terceiro', modulo: 'seguranca' },
  analise_critica: { rotulo: 'Análise crítica', modulo: 'sgi' },
  mudanca: { rotulo: 'Mudança', modulo: 'sgi' },
  ordem_de_servico: { rotulo: 'Ordem de serviço', modulo: 'servicos' },
  licenca: { rotulo: 'Licença', modulo: 'ambiental' },
  requisito_legal: { rotulo: 'Requisito legal', modulo: 'ambiental' },
  produto_quimico: { rotulo: 'Produto químico (FDS)', modulo: 'ambiental' },
  monitoramento: { rotulo: 'Monitoramento ambiental', modulo: 'ambiental' },
  tema_esg: { rotulo: 'Tema ESG', modulo: 'esg' },
  saida_de_residuo: {
    rotulo: 'Saída de resíduo (MTR/CDF)',
    modulo: 'ambiental',
  },
} as const;
export type RegistroComAnexo = keyof typeof REGISTROS_COM_ANEXO;

/** Permissão exigida para ver, anexar ou remover anexos de um tipo de registro. */
export function permissaoDoAnexo(
  registro: RegistroComAnexo,
  acao: 'ver' | 'editar' | 'excluir',
): Permissao {
  return `${REGISTROS_COM_ANEXO[registro].modulo}.${acao}` as Permissao;
}

/** Tipos aceitos: documento e foto. Executável, compactado e afins ficam de fora. */
export const TIPOS_DE_ANEXO = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
} as const;
export type TipoDeAnexo = keyof typeof TIPOS_DE_ANEXO;

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024;

const registro = {
  registro: z.enum(
    Object.keys(REGISTROS_COM_ANEXO) as [
      RegistroComAnexo,
      ...RegistroComAnexo[],
    ],
    { error: 'Registro desconhecido.' },
  ),
  registroId: z.uuid('Registro inválido.'),
};

export const novoAnexoSchema = z.object({
  ...registro,
  nome: z
    .string({ error: 'Escolha um arquivo.' })
    .trim()
    .min(1, 'Escolha um arquivo.')
    .max(200, 'Nome do arquivo com mais de 200 caracteres: renomeie antes.'),
  tipo: z.enum(chaves(TIPOS_DE_ANEXO), {
    error: 'Use PDF, JPG, PNG, WEBP, DOCX ou XLSX.',
  }),
  base64: z
    .string({ error: 'Escolha um arquivo.' })
    .min(1, 'O arquivo está vazio.')
    .refine(
      (b) => Math.floor((b.length * 3) / 4) <= TAMANHO_MAXIMO_ANEXO + 2,
      'O arquivo passa de 10 MB.',
    ),
  descricao: textoOpcional(200),
});
export type NovoAnexo = z.input<typeof novoAnexoSchema>;

export const filtroAnexosSchema = z.object(registro);

export interface Anexo {
  id: string;
  registro: RegistroComAnexo;
  registroId: string;
  nome: string;
  tipo: TipoDeAnexo;
  /** Bytes. */
  tamanho: number;
  descricao: string | null;
  criadoEm: string;
}

export interface ConteudoDoAnexo extends Anexo {
  base64: string;
}
