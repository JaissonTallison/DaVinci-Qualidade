import { somarDias } from '@davinci/shared';
import {
  DOCS_OBRIGATORIOS_TERCEIRO,
  TIPOS_DOC_TERCEIRO,
  type SituacaoTerceiro,
  type TipoDocTerceiro,
} from '@davinci/types';

type Doc = { id: string; tipo: string; validade: string };
const br = (d: string) => d.split('-').reverse().join('/');

/** O vigente de cada tipo é o de validade mais longa. */
export function vigentes<T extends Doc>(docs: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const d of docs) {
    const atual = m.get(d.tipo);
    if (!atual || d.validade > atual.validade) m.set(d.tipo, d);
  }
  return m;
}

/** Liberada: contrato vigente e os obrigatórios (PGR, PCMSO, ASO) válidos hoje; qualquer outro documento vencido também pendura. */
export function situacaoDoTerceiro(
  fimContrato: string | null,
  docs: Doc[],
  hoje: string,
): { situacao: SituacaoTerceiro; pendencias: string[] } {
  if (fimContrato && fimContrato < hoje)
    return { situacao: 'contrato_encerrado', pendencias: [] };
  const v = vigentes(docs);
  const pendencias: string[] = [];
  for (const tipo of DOCS_OBRIGATORIOS_TERCEIRO)
    if (!v.has(tipo))
      pendencias.push(`${TIPOS_DOC_TERCEIRO[tipo]} não enviado`);
  for (const [tipo, d] of v)
    if (d.validade < hoje)
      pendencias.push(
        `${TIPOS_DOC_TERCEIRO[tipo as TipoDocTerceiro]} vencido em ${br(d.validade)}`,
      );
  return { situacao: pendencias.length ? 'pendente' : 'liberada', pendencias };
}

export function vencendoEmBreve(validade: string, hoje: string): boolean {
  return validade >= hoje && validade <= somarDias(hoje, 30);
}
