// Testes de integração não dependem do RabbitMQ (o CI não tem): os anúncios de revogação
// vão para uma lista em memória, que os testes podem conferir.
import type { SessoesRevogadas } from '@davinci/types';
import { definirPublicador } from '../seguranca/revogacao.js';

export const anunciadas: SessoesRevogadas[] = [];
definirPublicador(async (dados) => {
  anunciadas.push(dados);
  return true;
});
