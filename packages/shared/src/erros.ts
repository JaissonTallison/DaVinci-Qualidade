import {
  Catch,
  Logger,
  type ArgumentsHost,
  type RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ehErroPadrao, type CodigoErro, type ErroPadrao } from '@davinci/types';
import { throwError, type Observable } from 'rxjs';

/**
 * Recusa de negócio com mensagem clara, que chega à tela como está.
 *   throw new ErroDeNegocio('CONFLITO', 'Este CNPJ já está cadastrado.');
 *   throw new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos.', [{ campo: 'cnpj', mensagem: 'Informe 14 dígitos.' }]);
 */
export class ErroDeNegocio extends RpcException {
  constructor(
    codigo: CodigoErro,
    mensagem: string,
    detalhes?: ErroPadrao['detalhes'],
  ) {
    super({
      codigo,
      mensagem,
      ...(detalhes ? { detalhes } : {}),
    } satisfies ErroPadrao);
  }
}

export const MENSAGEM_ERRO_INTERNO =
  'Não foi possível concluir a operação. Tente novamente em instantes.';

/**
 * Filtro global dos serviços: TODO erro sai no formato ErroPadrão.
 * Erro inesperado nunca vaza detalhe técnico: vai para o log com o rastreioId,
 * e o usuário recebe uma mensagem genérica com o mesmo rastreioId.
 */
@Catch()
export class FiltroDeErrosRpc implements RpcExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const dados = host
      .switchToRpc()
      .getData<{ contexto?: { rastreioId?: string } } | undefined>();
    const rastreioId = dados?.contexto?.rastreioId;
    const erro =
      exception instanceof RpcException ? exception.getError() : undefined;

    if (ehErroPadrao(erro)) {
      return throwError(() => ({
        ...erro,
        ...(rastreioId ? { rastreioId } : {}),
      }));
    }

    this.logger.error(
      `Erro inesperado${rastreioId ? ` [rastreio ${rastreioId}]` : ''}: ${(exception as Error)?.message ?? String(exception)}`,
      (exception as Error)?.stack,
    );
    return throwError(
      () =>
        ({
          codigo: 'INTERNO',
          mensagem: MENSAGEM_ERRO_INTERNO,
          ...(rastreioId ? { rastreioId } : {}),
        }) satisfies ErroPadrao,
    );
  }
}
