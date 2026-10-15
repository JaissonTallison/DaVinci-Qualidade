import { RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { ArgumentsHost } from '@nestjs/common';
import {
  ErroDeNegocio,
  FiltroDeErrosRpc,
  MENSAGEM_ERRO_INTERNO,
} from './erros.js';
import { lerContexto } from './mensagens.js';

const RASTREIO = '0192f1c4-0000-7000-8000-000000000abc';
const host = (dados: unknown) =>
  ({
    switchToRpc: () => ({ getData: () => dados }),
  }) as unknown as ArgumentsHost;
const capturar = (
  exception: unknown,
  dados: unknown = { contexto: { rastreioId: RASTREIO } },
) =>
  firstValueFrom(new FiltroDeErrosRpc().catch(exception, host(dados))).catch(
    (e: unknown) => e,
  );

describe('FiltroDeErrosRpc', () => {
  it('repassa o erro de negócio como está, com o rastreioId', async () => {
    const erro = await capturar(
      new ErroDeNegocio('CONFLITO', 'Este CNPJ já está cadastrado.'),
    );
    expect(erro).toEqual({
      codigo: 'CONFLITO',
      mensagem: 'Este CNPJ já está cadastrado.',
      rastreioId: RASTREIO,
    });
  });

  it('mantém os erros por campo', async () => {
    const erro = await capturar(
      new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos.', [
        { campo: 'cnpj', mensagem: 'Informe 14 dígitos.' },
      ]),
    );
    expect(erro).toMatchObject({
      detalhes: [{ campo: 'cnpj', mensagem: 'Informe 14 dígitos.' }],
    });
  });

  it('erro inesperado NÃO vaza detalhe técnico: vira mensagem genérica com rastreio', async () => {
    const erro = await capturar(
      new Error(
        'duplicate key value violates unique constraint "parceiros_pkey"',
      ),
    );
    expect(erro).toEqual({
      codigo: 'INTERNO',
      mensagem: MENSAGEM_ERRO_INTERNO,
      rastreioId: RASTREIO,
    });
    expect(JSON.stringify(erro)).not.toContain('duplicate key');
  });

  it('RpcException fora do padrão também vira erro interno', async () => {
    expect(await capturar(new RpcException('texto solto'))).toMatchObject({
      codigo: 'INTERNO',
    });
  });
});

describe('lerContexto', () => {
  it('aceita contexto válido', () => {
    const contexto = {
      empresaId: '00000000-0000-7000-8000-000000000001',
      usuarioId: null,
      rastreioId: RASTREIO,
    };
    expect(lerContexto({ contexto, dados: {} })).toEqual(contexto);
  });

  it('recusa mensagem sem contexto com erro de dados inválidos', () => {
    expect(() => lerContexto({ dados: {} })).toThrow(ErroDeNegocio);
  });
});
