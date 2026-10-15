import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import type {
  ConsumoDoMes,
  Permissao,
  DadosDoUsuario,
  IndicadoresSst,
  InventarioGee,
  Pilar,
  ResumoAmbiental,
  ResumoEsg,
  ResumoNcs,
  ResumoServicos,
  ResumoVencimentos,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { PilaresDaSustentabilidade } from "./pilares";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Painel ESG" };

interface Numero {
  rotulo: string;
  valor: string;
  explicacao: string;
  href: string;
  /** Pede ação. */
  ruim?: boolean;
}
const n = (v: number, casas = 1) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: casas });
const pct = (parte: number, total: number) =>
  total ? Math.round((parte / total) * 100) : 100;

/**
 * Indicadores ESG a partir do que cada módulo já registra (cada serviço continua dono do dado): ambiental do Meio
 * Ambiente, social da Segurança, Cadastros e Serviços, governança da Qualidade e da própria Agenda ESG.
 */
export default async function PainelEsg() {
  const eu = await chamarApi<DadosDoUsuario>("/auth/eu");
  if (!eu.ok) return <AvisoDeErro erro={eu.erro} />;
  const pode = (p: Permissao) => eu.dados.permissoes.includes(p);
  const ano = Number(hojeEmBrasilia().slice(0, 4));
  const se = <T,>(cond: boolean, caminho: string) =>
    cond ? chamarApi<T>(caminho) : Promise.resolve(null);
  const [gee, consumo, amb, sst, venc, serv, ncs, esg] = await Promise.all([
    se<InventarioGee>(
      pode("ambiental.ver"),
      `/consumo-ambiental/gee?ano=${ano}`,
    ),
    se<ConsumoDoMes[]>(pode("ambiental.ver"), `/consumo-ambiental?ano=${ano}`),
    se<ResumoAmbiental>(pode("ambiental.ver"), "/ambiental/resumo"),
    se<IndicadoresSst>(
      pode("seguranca.ver"),
      `/acidentes/indicadores?ano=${ano}`,
    ),
    se<ResumoVencimentos>(
      pode("seguranca.ver") && pode("funcionarios.ver"),
      "/vencimentos/resumo",
    ),
    se<ResumoServicos>(pode("servicos.ver"), "/servicos/resumo"),
    se<ResumoNcs>(pode("qualidade.ver"), "/nao-conformidades/resumo"),
    se<ResumoEsg>(pode("esg.ver"), "/esg/resumo"),
  ]);
  const ok = <T,>(
    r: { ok: true; dados: T } | { ok: false } | null,
  ): T | null => (r && r.ok ? r.dados : null);
  const [g, c, a, s, v, sv, nc, e] = [
    ok(gee),
    ok(consumo),
    ok(amb),
    ok(sst),
    ok(venc),
    ok(serv),
    ok(ncs),
    ok(esg),
  ];
  const total = (fonte: string) =>
    (c ?? [])
      .filter((x) => x.fonte === fonte)
      .reduce((t, x) => t + x.quantidade, 0);

  const pilares: Record<Pilar, Numero[]> = {
    ambiental: [],
    social: [],
    governanca: [],
  };
  if (g)
    pilares.ambiental.push({
      rotulo: `Emissões de GEE em ${ano}`,
      valor: `${n(g.total, 2)} t CO₂e`,
      explicacao: g.semFator.length
        ? "Total incompleto: falta fator de emissão"
        : `Escopo 1: ${n(g.escopo1, 2)} · escopo 2: ${n(g.escopo2, 2)}`,
      href: "/ambiental/gee",
      ruim: g.semFator.length > 0,
    });
  if (c) {
    pilares.ambiental.push({
      rotulo: `Energia elétrica em ${ano}`,
      valor: `${n(total("energia"), 0)} kWh`,
      explicacao: "Soma das leituras do ano",
      href: "/ambiental/consumo",
    });
    pilares.ambiental.push({
      rotulo: `Água em ${ano}`,
      valor: `${n(total("agua"))} m³`,
      explicacao: "Soma das leituras do ano",
      href: "/ambiental/consumo",
    });
  }
  if (a) {
    pilares.ambiental.push({
      rotulo: "Licenças vigentes",
      valor: `${pct(a.licencas - a.licencasVencidas, a.licencas)}%`,
      explicacao: `${a.licencasVencidas} vencidas de ${a.licencas}`,
      href: "/ambiental/licencas",
      ruim: a.licencasVencidas > 0,
    });
    pilares.ambiental.push({
      rotulo: "Monitoramentos fora do limite",
      valor: String(a.foraDoLimite),
      explicacao: "Último resultado de cada ponto",
      href: "/ambiental/monitoramentos",
      ruim: a.foraDoLimite > 0,
    });
  }
  if (s) {
    pilares.social.push({
      rotulo: `Taxa de frequência em ${ano}`,
      valor: s.total.tf === null ? "—" : n(s.total.tf, 2),
      explicacao:
        s.total.acidentesComAfastamento === 1
          ? "1 acidente com afastamento"
          : `${s.total.acidentesComAfastamento} acidentes com afastamento`,
      href: "/seguranca/indicadores",
    });
    pilares.social.push({
      rotulo: `Taxa de gravidade em ${ano}`,
      valor: s.total.tg === null ? "—" : n(s.total.tg, 0),
      explicacao: `${s.total.diasPerdidosEDebitados} dias perdidos e debitados`,
      href: "/seguranca/indicadores",
    });
    pilares.social.push({
      rotulo: "Dias sem acidente com afastamento",
      valor: s.diasSemAcidente === null ? "—" : String(s.diasSemAcidente),
      explicacao:
        s.diasSemAcidente === null ? "Nenhum registrado" : "Desde o último",
      href: "/seguranca/acidentes",
    });
  }
  if (v)
    pilares.social.push({
      rotulo: "ASO e treinamentos em dia",
      valor: `${pct(v.total - v.vencidos, v.total)}%`,
      explicacao: `${v.vencidos} vencidos de ${v.total}`,
      href: "/seguranca/vencimentos",
      ruim: v.vencidos > 0,
    });
  if (sv) {
    pilares.social.push({
      rotulo: "NPS dos clientes (12 meses)",
      valor: sv.nps12Meses === null ? "—" : String(sv.nps12Meses),
      explicacao: "Promotores menos detratores",
      href: "/servicos/nps",
    });
    pilares.governanca.push({
      rotulo: "Fornecedores reprovados",
      valor: String(sv.fornecedoresReprovados),
      explicacao: `${sv.avaliacoesVencidas} avaliações vencidas`,
      href: "/servicos/fornecedores",
      ruim: sv.fornecedoresReprovados > 0,
    });
  }
  if (a)
    pilares.governanca.push({
      rotulo: "Requisitos legais não atendidos",
      valor: String(a.requisitosNaoAtendidos),
      explicacao: `${a.avaliacoesVencidas} avaliações vencidas`,
      href: "/ambiental/requisitos",
      ruim: a.requisitosNaoAtendidos > 0,
    });
  if (nc)
    pilares.governanca.push({
      rotulo: "Não conformidades abertas",
      valor: String(nc.abertas),
      explicacao: `${nc.vencidas} vencidas · ${nc.graves} altas ou críticas`,
      href: "/qualidade/nao-conformidades",
      ruim: nc.vencidas > 0,
    });
  if (e)
    pilares.governanca.push({
      rotulo: "Temas materiais com meta atrasada",
      valor: String(e.metasAtrasadas),
      explicacao: `${e.materiais} temas materiais · ${e.odsComTemaMaterial} ODS atendidos`,
      href: "/esg/temas",
      ruim: e.metasAtrasadas > 0,
    });

  const titulos: Record<Pilar, string> = {
    ambiental: "Ambiental",
    social: "Social",
    governanca: "Governança",
  };
  return (
    <>
      <h1 className={tituloDaPagina}>Painel ESG</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Indicadores de {ano} vindos de cada módulo do sistema, organizados pelos
        três pilares. Clique em um número para ver os registros por trás dele.
      </p>
      <PilaresDaSustentabilidade />
      {(Object.keys(pilares) as Pilar[]).map((p) =>
        pilares[p].length === 0 ? null : (
          <section key={p} className="mt-8">
            <h2 className={tituloDaSecao}>{titulos[p]}</h2>
            <ul
              className={`${painel} mt-3 grid grid-cols-1 overflow-hidden sm:grid-cols-2 xl:grid-cols-3`}
            >
              {pilares[p].map((x) => (
                <li
                  key={x.rotulo}
                  className="border-b border-borda sm:border-r"
                >
                  <Link
                    href={x.href}
                    className="block h-full p-5 hover:bg-superficie-2"
                  >
                    <p className="text-sm text-texto-2">{x.rotulo}</p>
                    <p
                      className={`mt-1 inline-flex items-center gap-1.5 text-2xl font-semibold tabular-nums ${x.ruim ? "text-nao-conforme" : "text-texto"}`}
                    >
                      {x.ruim && (
                        <CircleAlert aria-hidden size={20} strokeWidth={2} />
                      )}
                      {x.valor}
                    </p>
                    <p className="mt-1 text-sm text-texto-2">{x.explicacao}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </>
  );
}
