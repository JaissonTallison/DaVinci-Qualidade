import { somarDias, somarMeses } from '@davinci/shared';
import {
  CATEGORIAS_DE_EQUIPAMENTO,
  type CategoriaDeEquipamento,
} from '@davinci/types';

/** Próximas datas pela periodicidade da categoria; o vencimento mais próximo é o que importa. */
export function vencimentosDoEquipamento(
  e: {
    categoria: CategoriaDeEquipamento;
    inspecaoDias: number;
    ultimaInspecao: string | null;
    ultimaRecarga: string | null;
    ultimoTeste: string | null;
  },
  hoje: string,
) {
  const c = CATEGORIAS_DE_EQUIPAMENTO[e.categoria];
  const proximaInspecao = e.ultimaInspecao
    ? somarDias(e.ultimaInspecao, e.inspecaoDias)
    : null;
  const proximaRecarga =
    c.recargaMeses && e.ultimaRecarga
      ? somarMeses(e.ultimaRecarga, c.recargaMeses)
      : null;
  const proximoTeste =
    c.testeMeses && e.ultimoTeste
      ? somarMeses(e.ultimoTeste, c.testeMeses)
      : null;
  const candidatos = [
    // Sem nenhuma inspeção, a primeira é devida já
    { o: 'Inspeção', data: proximaInspecao ?? hoje },
    ...(c.recargaMeses ? [{ o: 'Recarga', data: proximaRecarga ?? hoje }] : []),
    ...(c.testeMeses
      ? [{ o: 'Teste hidrostático', data: proximoTeste ?? hoje }]
      : []),
  ].sort((a, b) => a.data.localeCompare(b.data));
  const proximoVencimento = candidatos[0] ?? null;
  return {
    proximaInspecao,
    proximaRecarga,
    proximoTeste,
    proximoVencimento,
    vencido: Boolean(proximoVencimento && proximoVencimento.data < hoje),
  };
}
