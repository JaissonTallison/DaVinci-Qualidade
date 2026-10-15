import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import {
  ehErroPadrao,
  type Contexto,
  type ErroPadrao,
  type Mensagem,
  type ServiceName,
} from '@davinci/types';

/** Erro vindo de um serviço (ou da falta de resposta dele), já no formato padrão. */
export class ErroDoServico extends Error {
  constructor(readonly erro: ErroPadrao) {
    super(erro.mensagem);
  }
}

export const PRAZO_PADRAO_MS = 10_000;

/** A forma padrão de o gateway chamar um serviço: envia `{ contexto, dados }` e espera a resposta. */
@Injectable()
export class MensageriaService {
  constructor(private readonly moduleRef: ModuleRef) {}

  async enviar<R>(
    servico: ServiceName,
    padrao: string,
    dados: unknown,
    /** Rotas públicas (login, renovar) só têm o rastreio: empresa e usuário ainda não existem. */
    contexto: Contexto | { rastreioId: string },
    prazoMs = PRAZO_PADRAO_MS,
  ): Promise<R> {
    const client = this.moduleRef.get<ClientProxy>(servico, { strict: false });
    const mensagem = { contexto, dados } as Mensagem<unknown>;
    try {
      return await firstValueFrom(
        client.send<R>(padrao, mensagem).pipe(timeout(prazoMs)),
      );
    } catch (erro) {
      if (ehErroPadrao(erro)) {
        throw new ErroDoServico({
          ...erro,
          rastreioId: erro.rastreioId ?? contexto.rastreioId,
        });
      }
      if (erro instanceof TimeoutError) {
        throw new ErroDoServico({
          codigo: 'SERVICO_INDISPONIVEL',
          mensagem: `O módulo ${servico} não respondeu a tempo. Tente novamente em instantes.`,
          rastreioId: contexto.rastreioId,
        });
      }
      throw erro; // vira erro interno no filtro, com log
    }
  }
}
