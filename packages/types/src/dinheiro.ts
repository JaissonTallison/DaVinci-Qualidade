/**
 * Dinheiro exato (docs/02-arquitetura/banco-de-dados.md §8).
 *
 * - Por dentro: CENTAVOS INTEIROS (bigint). Nunca usa número com vírgula
 *   flutuante, então 0,1 + 0,2 é exatamente 0,30.
 * - No banco e na API: texto decimal com ponto e 2 casas ("1234.56"),
 *   o mesmo formato da coluna numeric(18,2) do Postgres.
 * - Na tela: "R$ 1.234,56" (negativos com o sinal de menos tipográfico "−").
 *
 * Arredondamento padrão: COMERCIAL (meio para cima, como o ARRED do Excel).
 * ABNT NBR 5891 (meio para o par) e truncar são escolhidos explicitamente.
 */

export type Arredondamento = 'comercial' | 'abnt' | 'truncar';

const DECIMAL = /^([+-])?(\d+)(?:\.(\d+))?$/;
const MENOS = '−';

/** Divide num/den (den > 0) arredondando conforme o modo. */
function dividir(num: bigint, den: bigint, modo: Arredondamento): bigint {
  const q = num / den; // trunca em direção ao zero
  const r = num % den;
  if (r === 0n || modo === 'truncar') return q;
  const sinal = num < 0n ? -1n : 1n;
  const dobroResto = (r < 0n ? -r : r) * 2n;
  if (dobroResto > den) return q + sinal;
  if (dobroResto < den) return q;
  // exatamente na metade
  if (modo === 'comercial') return q + sinal;
  return q % 2n === 0n ? q : q + sinal; // abnt: para o par
}

/** "0.015" → { num: 15n, escala: 1000n } */
function decimalExato(valor: string | number | bigint): {
  num: bigint;
  escala: bigint;
} {
  if (typeof valor === 'bigint') return { num: valor, escala: 1n };
  const texto =
    typeof valor === 'number' ? numeroParaTexto(valor) : valor.trim();
  const m = DECIMAL.exec(texto);
  if (!m) throw new RangeError(`Número decimal inválido: "${valor}"`);
  const casas = m[3] ?? '';
  const num = BigInt(m[2]! + casas) * (m[1] === '-' ? -1n : 1n);
  return { num, escala: 10n ** BigInt(casas.length) };
}

function numeroParaTexto(n: number): string {
  if (!Number.isFinite(n)) throw new RangeError(`Número inválido: ${n}`);
  // toFixed(10) evita notação científica; zeros à direita não alteram o valor
  return n.toFixed(10);
}

export class Dinheiro {
  private constructor(readonly centavos: bigint) {}

  static readonly ZERO = new Dinheiro(0n);

  /** A partir de centavos inteiros: Dinheiro.deCentavos(123456) → R$ 1.234,56 */
  static deCentavos(centavos: bigint | number): Dinheiro {
    if (typeof centavos === 'number' && !Number.isSafeInteger(centavos)) {
      throw new RangeError(`Centavos devem ser inteiros: ${centavos}`);
    }
    return new Dinheiro(BigInt(centavos));
  }

  /**
   * A partir do formato do banco/API ("1234.56", "-10", "0.5").
   * Mais de 2 casas exige escolher o arredondamento (evita perda silenciosa).
   */
  static de(valor: string, arredondamento?: Arredondamento): Dinheiro {
    const { num, escala } = decimalExato(valor);
    if (escala > 100n && arredondamento === undefined) {
      throw new RangeError(
        `"${valor}" tem mais de 2 casas: informe o arredondamento`,
      );
    }
    return new Dinheiro(
      dividir(num * 100n, escala, arredondamento ?? 'comercial'),
    );
  }

  /** A partir do texto digitado na tela: "1.234,56", "R$ 1.234,56", "−10,5" */
  static deTextoBR(texto: string): Dinheiro {
    const limpo = texto
      .replace(/R\$|\s| /g, '')
      .replace(MENOS, '-')
      .replace(/\./g, '')
      .replace(',', '.');
    return Dinheiro.de(limpo);
  }

  somar(...outros: Dinheiro[]): Dinheiro {
    return new Dinheiro(outros.reduce((t, o) => t + o.centavos, this.centavos));
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.centavos - outro.centavos);
  }

  negar(): Dinheiro {
    return new Dinheiro(-this.centavos);
  }

  /** Multiplica por um fator decimal exato ("1.5", "0.0333"). */
  multiplicar(
    fator: string | number | bigint,
    arredondamento: Arredondamento = 'comercial',
  ): Dinheiro {
    const { num, escala } = decimalExato(fator);
    return new Dinheiro(dividir(this.centavos * num, escala, arredondamento));
  }

  /** Percentual: juros de "1" (%) sobre R$ 1.234,57 → R$ 12,35 */
  percentual(
    taxa: string | number,
    arredondamento: Arredondamento = 'comercial',
  ): Dinheiro {
    const { num, escala } = decimalExato(taxa);
    return new Dinheiro(
      dividir(this.centavos * num, escala * 100n, arredondamento),
    );
  }

  /**
   * Divide em N parcelas que SOMAM exatamente o total: os centavos que sobram
   * vão para as primeiras parcelas. R$ 100,00 / 3 → 33,34 + 33,33 + 33,33.
   */
  parcelar(quantidade: number): Dinheiro[] {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new RangeError(`Quantidade de parcelas inválida: ${quantidade}`);
    }
    return this.ratear(Array.from({ length: quantidade }, () => 1));
  }

  /**
   * Rateia proporcionalmente aos pesos, sem perder centavo (maiores restos).
   * Ex.: rateio entre centros de custo: ratear([60, 40]).
   */
  ratear(pesos: Array<number | string>): Dinheiro[] {
    const ps = pesos.map((p) => {
      const { num, escala } = decimalExato(p);
      if (num < 0n) throw new RangeError('Pesos não podem ser negativos');
      return { num, escala };
    });
    // denominador comum para pesos com casas decimais diferentes
    const escalaComum = ps.reduce((m, p) => (p.escala > m ? p.escala : m), 1n);
    const inteiros = ps.map((p) => p.num * (escalaComum / p.escala));
    const soma = inteiros.reduce((a, b) => a + b, 0n);
    if (soma === 0n)
      throw new RangeError('A soma dos pesos deve ser maior que zero');

    const sinal = this.centavos < 0n ? -1n : 1n;
    const total = this.centavos * sinal;
    const base = inteiros.map((w) => (total * w) / soma);
    const restos = inteiros.map((w, i) => ({ i, resto: (total * w) % soma }));
    let sobra = total - base.reduce((a, b) => a + b, 0n);
    restos.sort((a, b) =>
      a.resto === b.resto ? a.i - b.i : a.resto > b.resto ? -1 : 1,
    );
    for (const { i } of restos) {
      if (sobra === 0n) break;
      base[i]! += 1n;
      sobra -= 1n;
    }
    return base.map((c) => new Dinheiro(c * sinal));
  }

  igual(outro: Dinheiro): boolean {
    return this.centavos === outro.centavos;
  }
  maiorQue(outro: Dinheiro): boolean {
    return this.centavos > outro.centavos;
  }
  menorQue(outro: Dinheiro): boolean {
    return this.centavos < outro.centavos;
  }
  ehZero(): boolean {
    return this.centavos === 0n;
  }
  ehNegativo(): boolean {
    return this.centavos < 0n;
  }

  /** Formato do banco/API: "1234.56" */
  toString(): string {
    const negativo = this.centavos < 0n;
    const abs = negativo ? -this.centavos : this.centavos;
    const reais = abs / 100n;
    const cents = (abs % 100n).toString().padStart(2, '0');
    return `${negativo ? '-' : ''}${reais}.${cents}`;
  }

  /** JSON usa o formato do banco/API (texto, nunca número). */
  toJSON(): string {
    return this.toString();
  }

  /**
   * Formato da tela: "R$ 1.234,56" · negativo "− R$ 12,35".
   * `sinal: 'sempre'` mostra "+ R$ …" em valores positivos (fluxos e variações).
   */
  formatar({
    sinal = 'negativo',
  }: { sinal?: 'negativo' | 'sempre' } = {}): string {
    const negativo = this.centavos < 0n;
    const abs = negativo ? -this.centavos : this.centavos;
    const reais = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const cents = (abs % 100n).toString().padStart(2, '0');
    const valor = `R$ ${reais},${cents}`;
    if (negativo) return `${MENOS} ${valor}`;
    return sinal === 'sempre' && abs > 0n ? `+ ${valor}` : valor;
  }
}
