/** Listas auxiliares que a empresa mantém (processo/área, tipo de causa…) e seleciona nos registros. */
import { z } from 'zod';
import { texto } from './validadores.js';

/** Cada lista de cadastro, com o rótulo no singular (para "Novo …") e no plural (título da tela). */
export const LISTAS_CADASTRO = {
  processo: { singular: 'Processo ou área', plural: 'Processos e áreas' },
  causa_nc: {
    singular: 'Tipo de causa ou desvio',
    plural: 'Tipos de causa e desvio',
  },
} as const;
export type ListaCadastro = keyof typeof LISTAS_CADASTRO;
export const ehListaCadastro = (v: string): v is ListaCadastro =>
  v in LISTAS_CADASTRO;

/** Um item de uma lista: nome e situação, por empresa. */
export interface ItemDeLista {
  id: string;
  nome: string;
  ativo: boolean;
  versao: string;
}

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

export const novoItemDeListaSchema = z.object({
  nome: texto('o nome', 100, 2),
});
export type NovoItemDeLista = z.input<typeof novoItemDeListaSchema>;

export const atualizarItemDeListaSchema = z.object({
  nome: texto('o nome', 100, 2),
  versao,
});
