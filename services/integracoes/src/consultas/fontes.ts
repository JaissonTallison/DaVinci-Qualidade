/**
 * Fontes públicas e a tradução das respostas para o vocabulário do DaVinci.
 * Cada consulta tenta a fonte principal e, se ela falhar (fora do ar, lenta, limite), a reserva.
 */
import type {
  ConsultaCep,
  ConsultaCnpj,
  Porte,
  SituacaoCadastral,
} from '@davinci/types';

export type Buscar = typeof fetch;
export const PRAZO_POR_FONTE_MS = 6_000;

/** A fonte respondeu que não existe (diferente de "não consegui perguntar"). */
export class NaoEncontrado extends Error {}

type ResultadoFonte<T> = Omit<T, 'fonte' | 'consultadoEm'>;
interface Fonte<T> {
  nome: string;
  consultar(chave: string, buscar: Buscar): Promise<ResultadoFonte<T>>;
}

async function obterJson(buscar: Buscar, url: string): Promise<unknown> {
  const r = await buscar(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(PRAZO_POR_FONTE_MS),
  });
  if (r.status === 404) throw new NaoEncontrado();
  if (!r.ok) throw new Error(`${url} respondeu ${r.status}`);
  return r.json();
}

const soDigitos = (v: unknown) =>
  typeof v === 'string' || typeof v === 'number'
    ? String(v).replace(/\D/g, '')
    : '';
const texto = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.replace(/\s+/g, ' ').trim() : null;

const SITUACOES: Record<number, SituacaoCadastral> = {
  1: 'nula',
  2: 'ativa',
  3: 'suspensa',
  4: 'inapta',
  8: 'baixada',
};
const PORTES: Record<number, Porte> = { 1: 'me', 3: 'epp', 5: 'demais' };

/** Formato da BrasilAPI e do Minha Receita (ambos espelham os dados abertos da Receita). */
interface RespostaCnpj {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  situacao_cadastral?: number;
  data_situacao_cadastral?: string | null;
  data_inicio_atividade?: string | null;
  natureza_juridica?: string;
  codigo_porte?: number;
  opcao_pelo_mei?: boolean | null;
  opcao_pelo_simples?: boolean | null;
  cnae_fiscal?: number | string;
  cnaes_secundarios?: { codigo?: number | string }[];
  email?: string | null;
  ddd_telefone_1?: string;
  cep?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  codigo_municipio_ibge?: number | string;
  identificador_matriz_filial?: number;
}

export function traduzirCnpj(d: RespostaCnpj): ResultadoFonte<ConsultaCnpj> {
  const cnpj = soDigitos(d.cnpj);
  if (cnpj.length !== 14 || !texto(d.razao_social))
    throw new Error('Resposta de CNPJ sem os dados essenciais');
  const situacao = SITUACOES[Number(d.situacao_cadastral)] ?? null;
  const cnae = soDigitos(d.cnae_fiscal).padStart(7, '0');
  const tipo = texto(d.descricao_tipo_de_logradouro);
  const logradouro = texto(d.logradouro);
  const cep = soDigitos(d.cep);
  const telefone = soDigitos(d.ddd_telefone_1);
  return {
    cnpj,
    razaoSocial: texto(d.razao_social)!,
    nomeFantasia: texto(d.nome_fantasia),
    situacaoCadastral: situacao,
    situacaoDesde:
      situacao && situacao !== 'ativa' && d.data_situacao_cadastral
        ? d.data_situacao_cadastral
        : null,
    dataAbertura: texto(d.data_inicio_atividade),
    naturezaJuridica: texto(d.natureza_juridica),
    porte: d.opcao_pelo_mei ? 'mei' : (PORTES[Number(d.codigo_porte)] ?? null),
    regimeTributario: d.opcao_pelo_mei
      ? 'mei'
      : d.opcao_pelo_simples
        ? 'simples'
        : null,
    cnaePrincipal: /^\d{7}$/.test(cnae) && cnae !== '0000000' ? cnae : null,
    cnaesSecundarios: (d.cnaes_secundarios ?? [])
      .map((c) => soDigitos(c.codigo).padStart(7, '0'))
      .filter((c) => /^\d{7}$/.test(c) && c !== '0000000'),
    email: texto(d.email)?.toLowerCase() ?? null,
    telefone: telefone.length >= 10 && telefone.length <= 11 ? telefone : null,
    endereco:
      cep.length === 8 && logradouro
        ? {
            cep,
            logradouro:
              tipo && !logradouro.toUpperCase().startsWith(tipo.toUpperCase())
                ? `${tipo} ${logradouro}`
                : logradouro,
            numero: texto(d.numero),
            complemento: texto(d.complemento),
            bairro: texto(d.bairro) ?? '',
            cidade: texto(d.municipio) ?? '',
            uf: texto(d.uf) ?? '',
            codigoMunicipio:
              soDigitos(d.codigo_municipio_ibge).length === 7
                ? soDigitos(d.codigo_municipio_ibge)
                : null,
          }
        : null,
    matriz: d.identificador_matriz_filial !== 2,
  };
}

export const FONTES_CNPJ: Fonte<ConsultaCnpj>[] = [
  {
    nome: 'BrasilAPI',
    consultar: async (cnpj, buscar) =>
      traduzirCnpj(
        (await obterJson(
          buscar,
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        )) as RespostaCnpj,
      ),
  },
  {
    nome: 'Minha Receita',
    consultar: async (cnpj, buscar) =>
      traduzirCnpj(
        (await obterJson(
          buscar,
          `https://minhareceita.org/${cnpj}`,
        )) as RespostaCnpj,
      ),
  },
];

export const FONTES_CEP: Fonte<ConsultaCep>[] = [
  {
    nome: 'BrasilAPI',
    consultar: async (cep, buscar) => {
      const d = (await obterJson(
        buscar,
        `https://brasilapi.com.br/api/cep/v2/${cep}`,
      )) as {
        cep?: string;
        state?: string;
        city?: string;
        neighborhood?: string;
        street?: string;
        ibge?: { city?: string };
      };
      if (soDigitos(d.cep) !== cep || !texto(d.city))
        throw new Error('Resposta de CEP incompleta');
      return {
        cep,
        logradouro: texto(d.street) ?? '',
        numero: null,
        complemento: null,
        bairro: texto(d.neighborhood) ?? '',
        cidade: texto(d.city)!,
        uf: texto(d.state) ?? '',
        codigoMunicipio:
          soDigitos(d.ibge?.city).length === 7 ? soDigitos(d.ibge?.city) : null,
      };
    },
  },
  {
    nome: 'ViaCEP',
    consultar: async (cep, buscar) => {
      const d = (await obterJson(
        buscar,
        `https://viacep.com.br/ws/${cep}/json/`,
      )) as {
        erro?: unknown;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        ibge?: string;
      };
      if (d.erro) throw new NaoEncontrado();
      return {
        cep,
        logradouro: texto(d.logradouro) ?? '',
        numero: null,
        complemento: null,
        bairro: texto(d.bairro) ?? '',
        cidade: texto(d.localidade) ?? '',
        uf: texto(d.uf) ?? '',
        codigoMunicipio:
          soDigitos(d.ibge).length === 7 ? soDigitos(d.ibge) : null,
      };
    },
  },
];
