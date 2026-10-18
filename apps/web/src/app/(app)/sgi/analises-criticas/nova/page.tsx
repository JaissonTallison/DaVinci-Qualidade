import type { Metadata } from "next";
import Link from "next/link";
import type {
  ResumoAuditorias,
  ResumoNcs,
  ResumoPlanos,
  ResumoSgi,
} from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeAnalise } from "./formulario";

export const metadata: Metadata = { title: "Registrar análise crítica" };

/** Junta os números que cada módulo já sabe, para a reunião não começar do zero. Módulo sem acesso fica de fora. */
export default async function NovaAnalise() {
  const [sgi, ncs, planos, auditorias] = await Promise.all([
    chamarApi<ResumoSgi>("/sgi/resumo"),
    chamarApi<ResumoNcs>("/nao-conformidades/resumo"),
    chamarApi<ResumoPlanos>("/planos-de-acao/resumo"),
    chamarApi<ResumoAuditorias>("/auditorias/resumo"),
  ]);
  const linhas: string[] = [];
  if (ncs.ok)
    linhas.push(
      `Não conformidades: ${ncs.dados.abertas} em aberto, ${ncs.dados.vencidas} vencidas, ${ncs.dados.graves} altas ou críticas.`,
    );
  if (planos.ok)
    linhas.push(
      `Planos de ação: ${planos.dados.emExecucao} em execução, ${planos.dados.atrasados} com tarefa vencida, ${planos.dados.aguardandoEficacia} aguardando eficácia.`,
    );
  if (auditorias.ok)
    linhas.push(
      `Auditorias: ${auditorias.dados.ncsUltimos12Meses} NCs nos últimos 12 meses.`,
    );
  if (sgi.ok) {
    linhas.push(
      `Objetivos: ${sgi.dados.objetivosFora} fora da meta na última medição, ${sgi.dados.objetivosSemMedicao} sem medição.`,
    );
    linhas.push(
      `Riscos e oportunidades: ${sgi.dados.rosAltosAbertos} com classificação alta em aberto, ${sgi.dados.rosComPrazoVencido} com prazo vencido.`,
    );
  }
  return (
    <>
      <Link
        href="/sgi/analises-criticas"
        className="dv-voltar"
      >
        Análises críticas
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Registrar análise crítica</h1>
      <FormularioDeAnalise
        resumoAutomatico={
          linhas.join("\n") || "Sem dados dos outros módulos para o seu perfil."
        }
      />
    </>
  );
}
