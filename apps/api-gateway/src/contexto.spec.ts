import { isUuid } from '@davinci/types';
import { lerRastreio } from './contexto.js';

describe('lerRastreio', () => {
  it('gera um rastreio quando nada é informado', () => {
    expect(isUuid(lerRastreio({}))).toBe(true);
  });

  it('respeita o rastreio válido vindo do cliente', () => {
    const rastreio = '0192f1c4-0000-7000-8000-000000000abc';
    expect(lerRastreio({ 'x-rastreio-id': rastreio })).toBe(rastreio);
  });

  it('ignora rastreio inválido', () => {
    expect(lerRastreio({ 'x-rastreio-id': "1' OR '1'='1" })).not.toBe(
      "1' OR '1'='1",
    );
  });
});
