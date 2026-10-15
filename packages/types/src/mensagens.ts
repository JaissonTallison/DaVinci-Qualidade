/**
 * Formato padrão das mensagens e dos erros entre gateway e serviços
 * (docs/02-arquitetura/banco-de-dados.md §8 · Passo 0, parte B).
 */
import { isUuid } from './uuid.js';

/** Quem pede, em nome de qual empresa, e o id para rastrear a operação nos logs. */
export interface Contexto {
  empresaId: string;
  /** Nulo até o login existir (Passo 2). */
  usuarioId: string | null;
  rastreioId: string;
}

/** Toda mensagem de negócio: `client.send(PADRAO, { contexto, dados })`. */
export interface Mensagem<T> {
  contexto: Contexto;
  dados: T;
}

export function ehContexto(valor: unknown): valor is Contexto {
  const c = valor as Contexto | null;
  return (
    typeof c === 'object' &&
    c !== null &&
    isUuid(c.empresaId) &&
    isUuid(c.rastreioId) &&
    (c.usuarioId === null || isUuid(c.usuarioId))
  );
}

/** Códigos de erro e o status HTTP que o gateway devolve para cada um. */
export const CODIGOS_ERRO = {
  DADOS_INVALIDOS: 400,
  NAO_AUTENTICADO: 401,
  SEM_PERMISSAO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  REGRA_DE_NEGOCIO: 422,
  INTERNO: 500,
  SERVICO_INDISPONIVEL: 503,
} as const;

export type CodigoErro = keyof typeof CODIGOS_ERRO;

/** Erro como chega à tela: mensagem clara em português, nunca detalhe técnico. */
export interface ErroPadrao {
  codigo: CodigoErro;
  mensagem: string;
  /** Erros por campo (formulários): [{ campo: 'cnpj', mensagem: 'Informe 14 dígitos.' }] */
  detalhes?: { campo?: string; mensagem: string }[];
  /** Para o suporte localizar a operação nos logs. */
  rastreioId?: string;
}

export function ehErroPadrao(valor: unknown): valor is ErroPadrao {
  const e = valor as ErroPadrao | null;
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof e.mensagem === 'string' &&
    typeof e.codigo === 'string' &&
    e.codigo in CODIGOS_ERRO
  );
}

/** Converte erros de validação (Zod) em `detalhes` por campo: [{ campo: 'documento', mensagem }]. */
export function detalhesDaValidacao(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): NonNullable<ErroPadrao['detalhes']> {
  return issues.map((i) => ({
    campo: i.path.map(String).join('.'),
    mensagem: i.message,
  }));
}
