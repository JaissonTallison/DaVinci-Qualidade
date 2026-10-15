import type { z } from 'zod';
import { detalhesDaValidacao } from '@davinci/types';
import { ErroDeNegocio } from './erros.js';

/**
 * Valida os dados com o schema Zod de @davinci/types. Se houver erro, recusa com
 * DADOS_INVALIDOS e as mensagens por campo (a tela marca cada campo).
 */
export function validar<S extends z.ZodType>(
  schema: S,
  dados: unknown,
): z.output<S> {
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeNegocio(
      'DADOS_INVALIDOS',
      'Verifique os campos destacados.',
      detalhesDaValidacao(resultado.error.issues),
    );
  }
  return resultado.data;
}
