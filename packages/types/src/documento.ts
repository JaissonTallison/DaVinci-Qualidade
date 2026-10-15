/**
 * CPF e CNPJ, incluindo o CNPJ ALFANUMÉRICO (emitido pela Receita desde jul/2026,
 * IN RFB 2.229/2024): 12 primeiros caracteres podem ser letras (A–Z) ou números;
 * os 2 dígitos verificadores são sempre números. Cálculo: valor do caractere =
 * código ASCII − 48 ("0"=0 … "9"=9, "A"=17 … "Z"=42), módulo 11.
 */

/** Remove pontuação e espaços; letras em maiúsculas. "12.abc.345/01de-35" → "12ABC34501DE35" */
export function normalizarDocumento(valor: string): string {
  return valor.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce(
    (t, c, i) => t + (c.charCodeAt(0) - 48) * pesos[i]!,
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

const todosIguais = (v: string) => /^(.)\1+$/.test(v);

export function cpfValido(valor: string): boolean {
  const cpf = normalizarDocumento(valor);
  if (!/^\d{11}$/.test(cpf) || todosIguais(cpf)) return false;
  const d1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(
    cpf.slice(0, 9) + d1,
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return cpf.endsWith(`${d1}${d2}`);
}

export function cnpjValido(valor: string): boolean {
  const cnpj = normalizarDocumento(valor);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || todosIguais(cnpj)) return false;
  const base = cnpj.slice(0, 12);
  const d1 = digitoVerificador(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(
    base + d1,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return cnpj.endsWith(`${d1}${d2}`);
}

/** Para exibição: 123.456.789-09 · 11.222.333/0001-81 · 12.ABC.345/01DE-35 */
export function formatarDocumento(valor: string): string {
  const d = normalizarDocumento(valor);
  if (d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return valor;
}

/** CEP para exibição: "01310100" → "01310-100" */
export function formatarCep(valor: string): string {
  const d = valor.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : valor;
}

/** Telefone para exibição: "1134567890" → "(11) 3456-7890" · "11987654321" → "(11) 98765-4321" */
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '');
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return valor;
}
