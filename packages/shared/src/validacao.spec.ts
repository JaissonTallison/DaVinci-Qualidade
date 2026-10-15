import { novoParceiroSchema } from '@davinci/types';
import { ErroDeNegocio } from './erros.js';
import { validar } from './validacao.js';

describe('validar', () => {
  it('devolve os dados normalizados quando válidos', () => {
    const r = validar(novoParceiroSchema, {
      tipoPessoa: 'PJ',
      documento: '11.222.333/0001-81',
      nome: 'Alfa',
      papeis: ['cliente'],
    });
    expect(r.documento).toBe('11222333000181');
  });

  it('recusa com DADOS_INVALIDOS e erros por campo', () => {
    try {
      validar(novoParceiroSchema, {
        tipoPessoa: 'PJ',
        documento: '1',
        nome: 'Alfa',
        papeis: [],
      });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErroDeNegocio);
      expect((e as ErroDeNegocio).getError()).toMatchObject({
        codigo: 'DADOS_INVALIDOS',
        mensagem: 'Verifique os campos destacados.',
        detalhes: expect.arrayContaining([
          {
            campo: 'documento',
            mensagem:
              'CNPJ inválido. Confira os dígitos (aceita o formato alfanumérico).',
          },
          {
            campo: 'papeis',
            mensagem: 'Marque pelo menos um papel (cliente, fornecedor…).',
          },
        ]),
      });
    }
  });
});
