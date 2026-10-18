import type { Metadata } from "next";
import Link from "next/link";
import type {
  AcidenteResumo,
  AuditoriaResumo,
  Acidente,
  NaoConformidade,
  NaoConformidadeResumo,
  OrigemPlano,
  Pagina,
} from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioNovoPlano, type Inicial } from "./formulario";

export const metadata: Metadata = { title: "Criar plano de ação" };

export default async function NovoPlano({
  searchParams,
}: PageProps<"/qualidade/planos-de-acao/novo">) {
  const { nc: ncId, acidente: acidenteId } = (await searchParams) as {
    nc?: string;
    acidente?: string;
  };
  const nc = ncId
    ? await chamarApi<NaoConformidade>(`/nao-conformidades/${ncId}`)
    : null;
  const acidente =
    !ncId && acidenteId
      ? await chamarApi<Acidente>(`/acidentes/${acidenteId}`)
      : null;
  // Registros das origens vinculáveis, para selecionar o "Registro de origem" em vez de digitar
  const [auditorias, acidentes, ncs] = await Promise.all([
    chamarApi<Pagina<AuditoriaResumo>>("/auditorias?porPagina=50"),
    chamarApi<Pagina<AcidenteResumo>>("/acidentes?porPagina=50"),
    chamarApi<Pagina<NaoConformidadeResumo>>("/nao-conformidades?porPagina=50"),
  ]);
  const opc = (numero: string, desc: string) => ({ numero, desc });
  const registrosPorOrigem: Partial<
    Record<OrigemPlano, { numero: string; desc: string }[]>
  > = {
    auditoria: auditorias.ok
      ? auditorias.dados.itens.map((a) => opc(a.numero, a.escopo))
      : [],
    acidente: acidentes.ok
      ? acidentes.dados.itens.map((a) => opc(a.numero, a.local))
      : [],
    nc: ncs.ok ? ncs.dados.itens.map((n) => opc(n.numero, n.titulo)) : [],
  };
  // Vindo de uma NC: origem, vínculo, responsável e a ação corretiva dela como primeira tarefa
  const inicial: Inicial | undefined = nc?.ok
    ? {
        valores: {
          origem: "nc",
          origemRef: nc.dados.numero,
          ncId: nc.dados.id,
          tipo: "corretiva",
          responsavel: nc.dados.responsavel,
          titulo: `Tratamento da ${nc.dados.numero}`,
        },
        tarefas: nc.dados.acaoCorretiva
          ? [
              {
                oQue: nc.dados.acaoCorretiva.slice(0, 300),
                responsavel: nc.dados.responsavel,
                prazo: nc.dados.prazo,
              },
            ]
          : undefined,
      }
    : acidente?.ok
      ? {
          // Vindo de um acidente: origem, referência e as causas da árvore como base das tarefas
          valores: {
            origem: "acidente",
            origemRef: acidente.dados.numero,
            tipo: "corretiva",
            titulo: `Ações do acidente ${acidente.dados.numero}`,
            objetivo: acidente.dados.medidas ?? "",
          },
          tarefas: acidente.dados.investigacao.fatos
            .filter((f) => f.componente !== "individuo")
            .slice(0, 5)
            .map((f) => ({ oQue: `Eliminar: ${f.fato}`.slice(0, 300) })),
        }
      : undefined;
  return (
    <>
      <Link
        href={
          nc?.ok
            ? `/qualidade/nao-conformidades/${nc.dados.id}`
            : acidente?.ok
              ? `/seguranca/acidentes/${acidente.dados.id}`
              : "/qualidade/planos-de-acao"
        }
        className="dv-voltar"
      >
        {nc?.ok
          ? nc.dados.numero
          : acidente?.ok
            ? acidente.dados.numero
            : "Planos de ação"}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Criar plano de ação</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Defina o resultado esperado e as tarefas: o que fazer, quem faz e até
        quando. O plano termina quando as tarefas estão concluídas e o resultado
        é verificado.
      </p>
      <FormularioNovoPlano
        hoje={hojeEmBrasilia()}
        inicial={inicial}
        registrosPorOrigem={registrosPorOrigem}
      />
    </>
  );
}
