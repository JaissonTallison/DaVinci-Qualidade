import {
  STATUS_INSPECAO,
  type RespostaItem,
  type StatusInspecao,
} from '@davinci/types';

/** A resposta vem do banco como texto; os valores possíveis estão no CHECK da tabela. */
interface ItemParaRegra {
  ordem: number;
  resposta: RespostaItem | (string & {}) | null;
  observacao: string | null;
}

/** Um NOK reprova; sem NOK, aprova. Só faz sentido com todos os itens respondidos (ver `pendenciasParaConcluir`). */
export function resultadoDaInspecao(
  itens: readonly ItemParaRegra[],
): Extract<StatusInspecao, 'aprovada' | 'reprovada'> {
  return itens.some((i) => i.resposta === 'nok') ? 'reprovada' : 'aprovada';
}

/**
 * O que impede concluir: item sem resposta e item NOK sem observação (a observação é a evidência que vai para a NC).
 * Lista vazia = pode concluir.
 */
export function pendenciasParaConcluir(
  itens: readonly ItemParaRegra[],
): { campo: string; mensagem: string }[] {
  const pendencias: { campo: string; mensagem: string }[] = [];
  for (const i of itens) {
    if (!i.resposta)
      pendencias.push({
        campo: `itens.${i.ordem}.resposta`,
        mensagem: `Responda o item ${i.ordem + 1}.`,
      });
    else if (i.resposta === 'nok' && !i.observacao?.trim())
      pendencias.push({
        campo: `itens.${i.ordem}.observacao`,
        mensagem: `Descreva o que foi encontrado no item ${i.ordem + 1} (NOK).`,
      });
  }
  return pendencias;
}

export const contarRespondidos = (itens: readonly ItemParaRegra[]) =>
  itens.filter((i) => i.resposta).length;
export const contarNaoConformes = (itens: readonly ItemParaRegra[]) =>
  itens.filter((i) => i.resposta === 'nok').length;

export function recusaPorStatusFinal(status: StatusInspecao): string | null {
  return status === 'em_andamento'
    ? null
    : `A inspeção está ${STATUS_INSPECAO[status].toLowerCase()}: não aceita mais alterações.`;
}

export function formatarNumeroInspecao(
  ano: number,
  sequencial: number,
): string {
  return `INS-${ano}-${String(sequencial).padStart(3, '0')}`;
}
