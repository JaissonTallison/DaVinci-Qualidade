/**
 * Consultas a fontes públicas (serviço Integrações): CNPJ na Receita e CEP.
 * O resultado já vem no vocabulário do DaVinci (mesmos códigos do cadastro de parceiros).
 */
import type {
  Porte,
  RegimeTributario,
  SituacaoCadastral,
} from './parceiros.js';

export interface EnderecoConsultado {
  cep: string;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  /** Código IBGE do município (7 dígitos). */
  codigoMunicipio: string | null;
}

export interface ConsultaCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacaoCadastral: SituacaoCadastral | null;
  /** Ex.: "Baixada em 2020-05-01". Útil para avisar a pessoa. */
  situacaoDesde: string | null;
  dataAbertura: string | null;
  naturezaJuridica: string | null;
  porte: Porte | null;
  /** Só quando a Receita informa a opção (MEI ou Simples Nacional); senão, nulo. */
  regimeTributario: RegimeTributario | null;
  cnaePrincipal: string | null;
  cnaesSecundarios: string[];
  email: string | null;
  telefone: string | null;
  endereco: EnderecoConsultado | null;
  matriz: boolean;
  /** De onde veio e quando (o cache pode devolver uma consulta de alguns dias atrás). */
  fonte: string;
  consultadoEm: string;
}

export interface ConsultaCep extends EnderecoConsultado {
  fonte: string;
  consultadoEm: string;
}
