import { NEVER, of, throwError } from 'rxjs';
import type { Contexto, ErroPadrao } from '@davinci/types';
import { ErroDeNegocio } from './erros.js';
import { pedir } from './pedido.js';

const ctx: Contexto = {
  empresaId: '0192f1c4-0000-7000-8000-00000000e001',
  usuarioId: null,
  rastreioId: '0192f1c4-0000-7000-8000-00000000a001',
};

describe('pedir a outro serviço', () => {
  it('envia { contexto, dados } e devolve a resposta', async () => {
    const enviados: unknown[] = [];
    const cliente = {
      send: (padrao: string, m: unknown) => (
        enviados.push([padrao, m]),
        of({ numero: 'NC-2026-004' })
      ),
    };
    await expect(
      pedir(
        cliente as never,
        'nao-conformidades.criar',
        { titulo: 'x' },
        ctx,
        'Qualidade',
      ),
    ).resolves.toEqual({ numero: 'NC-2026-004' });
    expect(enviados).toEqual([
      ['nao-conformidades.criar', { contexto: ctx, dados: { titulo: 'x' } }],
    ]);
  });

  it('recusa do outro serviço volta com o código e os campos', async () => {
    const recusa: ErroPadrao = {
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'Verifique os campos destacados.',
      detalhes: [{ campo: 'prazo', mensagem: 'Prazo inválido.' }],
    };
    const cliente = { send: () => throwError(() => recusa) };
    const erro = await pedir(cliente as never, 'x', {}, ctx, 'Qualidade').catch(
      (e: unknown) => e,
    );
    expect(erro).toBeInstanceOf(ErroDeNegocio);
    expect((erro as ErroDeNegocio).getError()).toEqual(recusa);
  });

  it('sem resposta no prazo: serviço indisponível, com o nome dele', async () => {
    const cliente = { send: () => NEVER };
    const erro = await pedir(
      cliente as never,
      'x',
      {},
      ctx,
      'Qualidade',
      20,
    ).catch((e: unknown) => e);
    expect((erro as ErroDeNegocio).getError()).toEqual({
      codigo: 'SERVICO_INDISPONIVEL',
      mensagem:
        'O serviço de Qualidade não respondeu. Tente de novo em instantes.',
    });
  });
});
