import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { ehErroPadrao, type Contexto } from '@davinci/types';
import { ErroDeNegocio } from './erros.js';

/**
 * Um serviço pedindo algo a outro e esperando a resposta (request/reply pela fila do outro).
 * Leva o contexto de quem pediu (empresa, usuário, rastreio). Se o outro serviço recusar, o erro volta como veio,
 * com o código e os campos; se não responder no prazo, vira SERVICO_INDISPONIVEL com o nome de quem não respondeu.
 *
 *   const nc = await pedir<NaoConformidade>(this.qualidade, PATTERNS.naoConformidades.criar, dados, ctx, 'Qualidade');
 */
export async function pedir<R>(
  cliente: Pick<ClientProxy, 'send'>,
  padrao: string,
  dados: unknown,
  contexto: Contexto,
  nomeDoServico: string,
  prazoMs = 8_000,
): Promise<R> {
  try {
    return await firstValueFrom(
      cliente.send<R>(padrao, { contexto, dados }).pipe(timeout(prazoMs)),
    );
  } catch (erro) {
    if (ehErroPadrao(erro))
      throw new ErroDeNegocio(erro.codigo, erro.mensagem, erro.detalhes);
    if (erro instanceof TimeoutError)
      throw new ErroDeNegocio(
        'SERVICO_INDISPONIVEL',
        `O serviço de ${nomeDoServico} não respondeu. Tente de novo em instantes.`,
      );
    throw erro;
  }
}
