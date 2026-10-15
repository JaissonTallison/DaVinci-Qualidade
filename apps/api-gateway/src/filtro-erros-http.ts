import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { CODIGOS_ERRO, type ErroPadrao } from '@davinci/types';
import type { RequisicaoComContexto } from './contexto.js';
import { ErroDoServico } from './mensageria.service.js';

export const MENSAGEM_ERRO_INTERNO =
  'Não foi possível concluir a operação. Tente novamente em instantes.';

/** Converte qualquer erro em `{ erro: ErroPadrao }` com o status HTTP do código. */
@Catch()
export class FiltroDeErrosHttp implements ExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<RequisicaoComContexto>();
    const res = http.getResponse<Response>();
    const rastreioId = req.rastreioId ?? req.contexto?.rastreioId;
    const erro = this.converter(exception, rastreioId);
    res
      .status(CODIGOS_ERRO[erro.codigo])
      .json({ erro: { ...erro, ...(rastreioId ? { rastreioId } : {}) } });
  }

  private converter(exception: unknown, rastreioId?: string): ErroPadrao {
    if (exception instanceof ErroDoServico) return exception.erro;
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === HttpStatus.NOT_FOUND)
        return {
          codigo: 'NAO_ENCONTRADO',
          mensagem: 'Recurso não encontrado.',
        };
      if (status === HttpStatus.UNAUTHORIZED)
        return { codigo: 'NAO_AUTENTICADO', mensagem: 'Entre para continuar.' };
      if (status === HttpStatus.FORBIDDEN)
        return {
          codigo: 'SEM_PERMISSAO',
          mensagem: 'Você não tem permissão para esta ação.',
        };
      if (status < 500)
        return { codigo: 'DADOS_INVALIDOS', mensagem: 'Requisição inválida.' };
    }
    this.logger.error(
      `Erro inesperado${rastreioId ? ` [rastreio ${rastreioId}]` : ''}: ${(exception as Error)?.message ?? String(exception)}`,
      (exception as Error)?.stack,
    );
    return { codigo: 'INTERNO', mensagem: MENSAGEM_ERRO_INTERNO };
  }
}
