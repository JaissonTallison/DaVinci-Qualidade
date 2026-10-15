import {
  BadRequestException,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common';
import {
  FiltroDeErrosHttp,
  MENSAGEM_ERRO_INTERNO,
} from './filtro-erros-http.js';
import { ErroDoServico } from './mensageria.service.js';

const RASTREIO = '0192f1c4-0000-7000-8000-000000000abc';

function aplicar(exception: unknown) {
  const resposta = { status: 0, corpo: undefined as unknown };
  const res = {
    status(s: number) {
      resposta.status = s;
      return this;
    },
    json(c: unknown) {
      resposta.corpo = c;
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ rastreioId: RASTREIO }),
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
  new FiltroDeErrosHttp().catch(exception, host);
  return resposta;
}

describe('FiltroDeErrosHttp', () => {
  it.each([
    ['DADOS_INVALIDOS', 400],
    ['NAO_ENCONTRADO', 404],
    ['CONFLITO', 409],
    ['REGRA_DE_NEGOCIO', 422],
    ['SERVICO_INDISPONIVEL', 503],
  ] as const)('%s → HTTP %i', (codigo, status) => {
    const r = aplicar(new ErroDoServico({ codigo, mensagem: 'm' }));
    expect(r.status).toBe(status);
    expect(r.corpo).toEqual({
      erro: { codigo, mensagem: 'm', rastreioId: RASTREIO },
    });
  });

  it('rota inexistente → 404 em português', () => {
    expect(aplicar(new NotFoundException())).toMatchObject({
      status: 404,
      corpo: {
        erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado.' },
      },
    });
  });

  it('requisição mal formada → 400', () => {
    expect(aplicar(new BadRequestException()).status).toBe(400);
  });

  it('erro inesperado → 500 sem vazar detalhe técnico', () => {
    const r = aplicar(new Error('connect ECONNREFUSED 127.0.0.1:5550'));
    expect(r).toEqual({
      status: 500,
      corpo: {
        erro: {
          codigo: 'INTERNO',
          mensagem: MENSAGEM_ERRO_INTERNO,
          rastreioId: RASTREIO,
        },
      },
    });
    expect(JSON.stringify(r)).not.toContain('ECONNREFUSED');
  });
});
