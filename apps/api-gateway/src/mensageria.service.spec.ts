import { Test } from '@nestjs/testing';
import { NEVER, of, throwError } from 'rxjs';
import { SERVICES, type Contexto } from '@davinci/types';
import { ErroDoServico, MensageriaService } from './mensageria.service.js';

const contexto: Contexto = {
  empresaId: '00000000-0000-7000-8000-000000000001',
  usuarioId: null,
  rastreioId: '0192f1c4-0000-7000-8000-000000000abc',
};

async function mensageriaCom(send: (padrao: string, msg: unknown) => unknown) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      MensageriaService,
      { provide: SERVICES.CODEX, useValue: { send } },
    ],
  }).compile();
  return moduleRef.get(MensageriaService);
}

describe('MensageriaService', () => {
  it('envia { contexto, dados } e devolve a resposta', async () => {
    let recebida: unknown;
    const m = await mensageriaCom((_, msg) => {
      recebida = msg;
      return of({ id: '1' });
    });
    expect(
      await m.enviar(
        SERVICES.CODEX,
        'parceiros.criar',
        { nome: 'Alfa' },
        contexto,
      ),
    ).toEqual({ id: '1' });
    expect(recebida).toEqual({ contexto, dados: { nome: 'Alfa' } });
  });

  it('repassa a recusa de negócio do serviço, com o rastreio', async () => {
    const m = await mensageriaCom(() =>
      throwError(() => ({
        codigo: 'CONFLITO',
        mensagem: 'Este CNPJ já está cadastrado.',
      })),
    );
    const erro = await m
      .enviar(SERVICES.CODEX, 'x', {}, contexto)
      .catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDoServico);
    expect((erro as ErroDoServico).erro).toEqual({
      codigo: 'CONFLITO',
      mensagem: 'Este CNPJ já está cadastrado.',
      rastreioId: contexto.rastreioId,
    });
  });

  it('serviço que não responde no prazo vira SERVICO_INDISPONIVEL', async () => {
    const m = await mensageriaCom(() => NEVER);
    const erro = await m
      .enviar(SERVICES.CODEX, 'x', {}, contexto, 50)
      .catch((e: unknown) => e);
    expect((erro as ErroDoServico).erro).toMatchObject({
      codigo: 'SERVICO_INDISPONIVEL',
      mensagem:
        'O módulo codex não respondeu a tempo. Tente novamente em instantes.',
    });
  });
});
