type CamposDeEndereco = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigoMunicipio: string;
};
type ResultadoCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigoMunicipio: string | null;
};

const normal = (v: string) =>
  v
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

/**
 * Aplica o resultado da consulta de CEP: preenche os campos vazios (ou todos, com `substituir`).
 * O código do município (que a NF-e exige) só acompanha quando cidade e UF batem com as do CEP;
 * senão o endereço ficaria com o código de uma cidade e o nome de outra.
 */
export function aplicarCep<T extends CamposDeEndereco>(
  atual: T,
  c: ResultadoCep,
  substituir: boolean,
): { endereco: T; aviso?: string } {
  const usar = (k: 'logradouro' | 'bairro' | 'cidade' | 'uf', novo: string) =>
    substituir || !atual[k].trim() ? novo || atual[k] : atual[k];
  const endereco = {
    ...atual,
    logradouro: usar('logradouro', c.logradouro),
    bairro: usar('bairro', c.bairro),
    cidade: usar('cidade', c.cidade),
    uf: usar('uf', c.uf),
  };
  if (normal(endereco.cidade) === normal(c.cidade) && endereco.uf === c.uf)
    return {
      endereco: { ...endereco, codigoMunicipio: c.codigoMunicipio ?? '' },
    };
  return {
    endereco,
    aviso: `Este CEP é de ${c.cidade}/${c.uf}, mas o endereço está em ${endereco.cidade}/${endereco.uf}. Use "Buscar endereço pelo CEP" para substituir.`,
  };
}
