import type { Metadata } from "next";
import {
  GRUPOS_DE_RISCO,
  HIERARQUIAS_DE_CONTROLE,
  NIVEIS_DE_RISCO,
  type DadosDoUsuario,
  type Risco,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FolhaDeDocumento } from "@/components/folha-de-documento";
import { chamarApi } from "@/lib/api";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { BASE_LEGAL_PGR } from "../base-legal";

export const metadata: Metadata = { title: "Documento do PGR" };

const thCell = "border border-borda-forte px-2 py-1.5 text-left font-semibold";
const tdCell = "border border-borda-forte px-2 py-1.5 align-top";

export default async function DocumentoDoPgr() {
  const [r, eu] = await Promise.all([
    chamarApi<Risco[]>("/riscos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const riscos = r.dados;
  const comPlano = riscos.filter((x) => x.acoes);
  const empresa = eu.ok ? eu.dados.empresa.nome : "";
  const hoje = hojeEmBrasilia();

  return (
    <FolhaDeDocumento
      tipo="Programa de Gerenciamento de Riscos (PGR) · NR-1"
      titulo="Inventário de riscos e plano de ação"
      subtitulo="Riscos ocupacionais ativos da organização"
      empresa={empresa}
      emitidoEm={formatarData(hoje)}
      paisagem
      voltarHref="/seguranca/pgr"
      voltarRotulo="Voltar ao PGR"
      assinaturas={[
        { papel: "Responsável técnico (SESMT / Eng. de Segurança)" },
        { papel: "Responsável pela organização" },
      ]}
    >
      <section className="mt-6 break-inside-avoid">
        <h2 className="text-base font-semibold text-texto">
          1. Inventário de riscos ocupacionais
        </h2>
        {riscos.length === 0 ? (
          <p className="mt-2 text-sm text-texto-2">
            Nenhum risco ativo no inventário.
          </p>
        ) : (
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-superficie-2">
                <th className={thCell}>Grupo</th>
                <th className={thCell}>Setor ou atividade</th>
                <th className={thCell}>Perigo</th>
                <th className={thCell}>Possíveis danos</th>
                <th className={thCell}>S × P</th>
                <th className={thCell}>Nível</th>
                <th className={thCell}>Controles existentes</th>
              </tr>
            </thead>
            <tbody>
              {riscos.map((x) => (
                <tr key={x.id}>
                  <td className={tdCell}>{GRUPOS_DE_RISCO[x.grupo]}</td>
                  <td className={tdCell}>{x.local}</td>
                  <td className={tdCell}>{x.perigo}</td>
                  <td className={tdCell}>{x.danos}</td>
                  <td className={`${tdCell} whitespace-nowrap tabular-nums`}>
                    {x.severidade} × {x.probabilidade}
                  </td>
                  <td className={`${tdCell} whitespace-nowrap`}>
                    {NIVEIS_DE_RISCO[x.nivel]}
                  </td>
                  <td className={tdCell}>{x.controles ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <h2 className="text-base font-semibold text-texto">2. Plano de ação</h2>
        {comPlano.length === 0 ? (
          <p className="mt-2 text-sm text-texto-2">
            Nenhuma medida a implementar registrada.
          </p>
        ) : (
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-superficie-2">
                <th className={thCell}>Setor ou atividade</th>
                <th className={thCell}>Perigo</th>
                <th className={thCell}>Nível</th>
                <th className={thCell}>Medida a implementar</th>
                <th className={thCell}>Hierarquia</th>
                <th className={thCell}>Responsável</th>
                <th className={thCell}>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {comPlano.map((x) => (
                <tr key={x.id}>
                  <td className={tdCell}>{x.local}</td>
                  <td className={tdCell}>{x.perigo}</td>
                  <td className={`${tdCell} whitespace-nowrap`}>
                    {NIVEIS_DE_RISCO[x.nivel]}
                  </td>
                  <td className={tdCell}>{x.acoes}</td>
                  <td className={tdCell}>
                    {x.hierarquiaControle
                      ? HIERARQUIAS_DE_CONTROLE[x.hierarquiaControle]
                      : "—"}
                  </td>
                  <td className={tdCell}>{x.responsavel ?? "—"}</td>
                  <td className={`${tdCell} whitespace-nowrap`}>
                    {x.prazo ? formatarData(x.prazo) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <h2 className="text-base font-semibold text-texto">3. Base legal</h2>
        <p className="mt-1 text-sm text-texto-2">
          {BASE_LEGAL_PGR.norma}. {BASE_LEGAL_PGR.ementa}
        </p>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-superficie-2">
              <th className={`${thCell} whitespace-nowrap`}>Item da NR-1</th>
              <th className={thCell}>Requisito</th>
              <th className={thCell}>Como o PGR atende</th>
            </tr>
          </thead>
          <tbody>
            {BASE_LEGAL_PGR.itens.map((i) => (
              <tr key={i.item}>
                <td className={`${tdCell} whitespace-nowrap font-mono`}>
                  {i.item}
                </td>
                <td className={tdCell}>{i.titulo}</td>
                <td className={tdCell}>{i.comoAtende}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-texto-3">{BASE_LEGAL_PGR.fonte}</p>
      </section>
    </FolhaDeDocumento>
  );
}
