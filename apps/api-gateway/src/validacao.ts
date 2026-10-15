import type { z } from 'zod';
import { detalhesDaValidacao } from '@davinci/types';
import { ErroDoServico } from './mensageria.service.js';

/**
 * Valida no gateway com o MESMO schema do serviço: dado inválido é recusado aqui,
 * sem ocupar a fila. Os dados ORIGINAIS seguem para o serviço, que valida de novo.
 */
export function validarEntrada(
  schema: z.ZodType,
  dados: unknown,
  rastreioId: string,
): void {
  const r = schema.safeParse(dados);
  if (!r.success) {
    throw new ErroDoServico({
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'Verifique os campos destacados.',
      detalhes: detalhesDaValidacao(r.error.issues),
      rastreioId,
    });
  }
}
