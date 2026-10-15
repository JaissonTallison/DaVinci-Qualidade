import { Dinheiro } from './dinheiro.js';

const R = (v: string) => Dinheiro.de(v);

describe('Dinheiro: exatidão', () => {
  it('0,10 + 0,20 é exatamente 0,30 (o erro clássico dos números flutuantes não acontece)', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(R('0.10').somar(R('0.20')).toString()).toBe('0.30');
  });

  it('soma 1 milhão de lançamentos de R$ 0,01 sem erro', () => {
    let total = Dinheiro.ZERO;
    const centavo = R('0.01');
    for (let i = 0; i < 1_000_000; i++) total = total.somar(centavo);
    expect(total.toString()).toBe('10000.00');
  });
});

describe('Dinheiro: conversões', () => {
  it.each([
    ['1234.56', '1234.56'],
    ['0.5', '0.50'],
    ['-10', '-10.00'],
    ['999999999999999.99', '999999999999999.99'],
  ])('lê "%s" do banco e devolve "%s"', (entrada, saida) => {
    expect(R(entrada).toString()).toBe(saida);
  });

  it('recusa mais de 2 casas sem arredondamento explícito', () => {
    expect(() => R('1.005')).toThrow(/mais de 2 casas/);
    expect(Dinheiro.de('1.005', 'comercial').toString()).toBe('1.01');
  });

  it('recusa texto que não é número', () => {
    expect(() => R('abc')).toThrow(/inválido/);
  });

  it.each([
    ['1.234,56', '1234.56'],
    ['R$ 1.234,56', '1234.56'],
    ['−12,35', '-12.35'],
    ['0,5', '0.50'],
  ])('lê o texto digitado "%s"', (entrada, saida) => {
    expect(Dinheiro.deTextoBR(entrada).toString()).toBe(saida);
  });

  it('serializa em JSON como texto', () => {
    expect(JSON.stringify({ valor: R('1234.5') })).toBe('{"valor":"1234.50"}');
  });
});

describe('Dinheiro: formatação na tela', () => {
  it.each([
    ['1284530.90', 'R$ 1.284.530,90'],
    ['0', 'R$ 0,00'],
    ['-12940.35', '− R$ 12.940,35'],
    ['999.99', 'R$ 999,99'],
  ])('%s → %s', (valor, texto) => {
    expect(R(valor).formatar()).toBe(texto);
  });

  it('mostra "+" quando pedido (fluxos e variações)', () => {
    expect(R('48210').formatar({ sinal: 'sempre' })).toBe('+ R$ 48.210,00');
    expect(R('0').formatar({ sinal: 'sempre' })).toBe('R$ 0,00');
  });
});

describe('Dinheiro: arredondamento', () => {
  it.each([
    // [valor, comercial, abnt, truncar]: a tabela apresentada na decisão
    ['2.345', '2.35', '2.34', '2.34'],
    ['2.355', '2.36', '2.36', '2.35'],
    ['-2.345', '-2.35', '-2.34', '-2.34'],
    ['2.3449', '2.34', '2.34', '2.34'],
  ])(
    '%s → comercial %s · abnt %s · truncar %s',
    (v, comercial, abnt, truncar) => {
      expect(Dinheiro.de(v, 'comercial').toString()).toBe(comercial);
      expect(Dinheiro.de(v, 'abnt').toString()).toBe(abnt);
      expect(Dinheiro.de(v, 'truncar').toString()).toBe(truncar);
    },
  );

  it('juros de 1% sobre R$ 1.234,57 = R$ 12,35 (12,3457 arredondado comercialmente)', () => {
    expect(R('1234.57').percentual('1').toString()).toBe('12.35');
  });

  it('multa de 2% + juros de 0,033% ao dia × 10 dias sobre R$ 1.000,00', () => {
    const principal = R('1000');
    const multa = principal.percentual('2');
    const juros = principal.percentual('0.033').multiplicar(10);
    expect(multa.toString()).toBe('20.00');
    expect(juros.toString()).toBe('3.30');
    expect(principal.somar(multa, juros).formatar()).toBe('R$ 1.023,30');
  });
});

describe('Dinheiro: parcelas e rateio', () => {
  it('R$ 100,00 em 3 parcelas: 33,34 + 33,33 + 33,33 (soma exata)', () => {
    const parcelas = R('100').parcelar(3);
    expect(parcelas.map(String)).toEqual(['33.34', '33.33', '33.33']);
    expect(Dinheiro.ZERO.somar(...parcelas).toString()).toBe('100.00');
  });

  it('R$ 0,10 em 3 parcelas: 0,04 + 0,03 + 0,03', () => {
    expect(R('0.10').parcelar(3).map(String)).toEqual(['0.04', '0.03', '0.03']);
  });

  it('parcela valores negativos (estornos) mantendo o sinal', () => {
    expect(R('-100').parcelar(3).map(String)).toEqual([
      '-33.34',
      '-33.33',
      '-33.33',
    ]);
  });

  it('rateia R$ 1.000,00 entre centros de custo 60% / 25% / 15%', () => {
    expect(R('1000').ratear([60, 25, 15]).map(String)).toEqual([
      '600.00',
      '250.00',
      '150.00',
    ]);
  });

  it('rateio com dízima não perde centavo: R$ 10,00 em 3 partes iguais', () => {
    const partes = R('10').ratear(['1', '1', '1']);
    expect(Dinheiro.ZERO.somar(...partes).toString()).toBe('10.00');
  });

  it('recusa parcelas inválidas e pesos negativos', () => {
    expect(() => R('10').parcelar(0)).toThrow();
    expect(() => R('10').ratear([1, -1])).toThrow();
  });
});
