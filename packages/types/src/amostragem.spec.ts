import { describe, expect, it } from 'vitest';
import { loteAceito, planoDeAmostragem } from './amostragem.js';

const resumo = (
  lote: number,
  nivel: 'I' | 'II' | 'III',
  nqa: Parameters<typeof planoDeAmostragem>[2],
) => {
  const p = planoDeAmostragem(lote, nivel, nqa);
  return [p.letraDoPlano, p.amostra, p.aceita, p.rejeita];
};

describe('Plano de amostragem (NBR 5426, simples, normal)', () => {
  it('letra-código pela tabela 1', () => {
    expect(planoDeAmostragem(1000, 'II', '2.5').letra).toBe('J');
    expect(planoDeAmostragem(1000, 'I', '2.5').letra).toBe('G');
    expect(planoDeAmostragem(1000, 'III', '2.5').letra).toBe('K');
    expect(planoDeAmostragem(5, 'II', '2.5').letra).toBe('A');
    expect(planoDeAmostragem(600000, 'III', '2.5').letra).toBe('R');
  });

  it('valores da tabela 2-A sem setas', () => {
    expect(resumo(1000, 'II', '2.5')).toEqual(['J', 80, 5, 6]);
    expect(resumo(1000, 'II', '0.65')).toEqual(['J', 80, 1, 2]);
    expect(resumo(1000, 'II', '1.0')).toEqual(['J', 80, 2, 3]);
    expect(resumo(1000, 'II', '4.0')).toEqual(['J', 80, 7, 8]);
    expect(resumo(1000, 'II', '6.5')).toEqual(['J', 80, 10, 11]);
    expect(resumo(1000, 'II', '10')).toEqual(['J', 80, 14, 15]);
    expect(resumo(3000, 'II', '1.0')).toEqual(['K', 125, 3, 4]);
    expect(resumo(50000, 'II', '1.0')).toEqual(['N', 500, 10, 11]);
  });

  it('seta para baixo: usa a primeira letra abaixo com plano (e a amostra dela)', () => {
    // G (32) com NQA 1,0 é seta para baixo: H (50), Ac 1
    expect(resumo(1000, 'I', '1.0')).toEqual(['H', 50, 1, 2]);
    // NQA baixo em lote pequeno desce até o Ac 0
    expect(resumo(100, 'II', '0.65')).toEqual(['F', 20, 0, 1]);
  });

  it('seta para cima: usa a primeira letra acima com plano', () => {
    // G (32) com NQA 0,65 é seta para cima: F (20), Ac 0
    expect(resumo(300, 'I', '0.65')).toEqual(['F', 20, 0, 1]);
    // R com NQA 10 passa de 21: sobe até a letra com Ac 21 (K, 125)
    expect(resumo(600000, 'III', '10')).toEqual(['K', 125, 21, 22]);
    // Seta para cima na primeira letra (A, NQA 10) não tem plano acima: desce até o Ac 1
    expect(resumo(5, 'II', '10')).toEqual(['C', 5, 1, 2]);
  });

  it('amostra maior que o lote: inspeção de 100%', () => {
    const p = planoDeAmostragem(10, 'II', '0.065');
    expect(p.cemPorCento).toBe(true);
    expect(p.amostra).toBe(10);
  });

  it('aceita com até Ac defeituosos', () => {
    const p = planoDeAmostragem(1000, 'II', '2.5');
    expect(loteAceito(p, 5)).toBe(true);
    expect(loteAceito(p, 6)).toBe(false);
  });
});
