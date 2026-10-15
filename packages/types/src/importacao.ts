/** Importação de clientes e fornecedores por planilha (linhas já lidas no navegador). */
import { z } from 'zod';

export const TIPOS_IMPORTACAO = {
  parceiros: 'Clientes e fornecedores',
} as const;
export type TipoImportacao = keyof typeof TIPOS_IMPORTACAO;
/** Linhas já lidas da planilha (cabeçalho → valor). */
export const importacaoSchema = z.object({
  linhas: z
    .array(z.record(z.string(), z.string()))
    .min(1, 'A planilha está vazia.')
    .max(5000, 'Use no máximo 5.000 linhas por arquivo.'),
  simular: z.boolean().default(true),
});
export interface ResultadoDaImportacaoPlanilha {
  total: number;
  validas: number;
  criadas: number;
  erros: { linha: number; mensagem: string }[];
}
/** Colunas do modelo (a primeira linha da planilha). */
export const MODELOS_IMPORTACAO: Record<
  TipoImportacao,
  { colunas: string[]; exemplo: string[] }
> = {
  parceiros: {
    colunas: [
      'tipo_pessoa',
      'documento',
      'nome',
      'papeis',
      'email',
      'telefone',
      'nome_fantasia',
      'inscricao_estadual',
    ],
    exemplo: [
      'PJ',
      '11.222.333/0001-81',
      'Laboratório Alfa Ltda',
      'fornecedor',
      'qualidade@alfa.com.br',
      '(11) 3456-7890',
      'Lab Alfa',
      '',
    ],
  },
};
