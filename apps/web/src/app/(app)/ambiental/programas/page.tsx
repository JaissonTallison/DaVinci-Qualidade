import type { Metadata } from "next";
import Link from "next/link";
import {
  INDICADORES_DO_PROGRAMA,
  type DadosDoUsuario,
  type ProgramaAmbiental,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovoPrograma } from "./formularios";

export const metadata: Metadata = { title: "Programas e metas ambientais" };

const numero = (v: number | null) =>
  v === null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

/** Objetivos ambientais (ISO 14001, 6.2) com linha de base, meta, ações e o valor atual vindo dos dados do sistema. */
export default async function Programas() {
  const [r, eu] = await Promise.all([
    chamarApi<ProgramaAmbiental[]>("/programas-ambientais"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  return (
    <>
      <h1 className={tituloDaPagina}>Programas e metas ambientais</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada programa parte de uma linha de base e persegue uma meta com prazo.
        Indicadores de água, energia, resíduos e emissões são calculados pelo
        sistema (ano corrente); o indicador próprio é medido mês a mês.
      </p>
      {podeEditar && (
        <Recolhido titulo="Novo programa">
          <NovoPrograma />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!r.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={r.erro} />
          </div>
        ) : r.dados.length === 0 ? (
          <p className="px-5 py-6 text-base text-texto-2">Nenhum programa.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {r.dados.map((p) => (
              <li
                key={p.id}
                className={`grid gap-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_14rem] ${p.encerrado ? "text-texto-3" : ""}`}
              >
                <div>
                  <Link
                    href={`/ambiental/programas/${p.id}`}
                    className="text-base text-info hover:underline"
                  >
                    {p.nome}
                  </Link>
                  <p className="text-sm text-texto-2">
                    {INDICADORES_DO_PROGRAMA[p.indicador]} · meta{" "}
                    {numero(p.meta)} {p.unidade} até {formatarData(p.prazo)}
                    {p.encerrado && " · encerrado"}
                  </p>
                </div>
                <div className="text-sm">
                  <p>
                    Atual:{" "}
                    <span className="font-semibold tabular-nums">
                      {numero(p.atual)}
                    </span>{" "}
                    {p.unidade}
                  </p>
                  {p.progresso !== null && (
                    <div
                      className="mt-1 h-2 rounded-xs bg-superficie-2"
                      role="img"
                      aria-label={`${p.progresso}% do caminho até a meta`}
                    >
                      <div
                        className={`h-full rounded-xs ${p.progresso >= 100 ? "bg-conforme" : "bg-info"}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, p.progresso))}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
