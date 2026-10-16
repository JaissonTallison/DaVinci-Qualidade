import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import {
  CLASSES_RESIDUO,
  UNIDADES_RESIDUO,
  type DadosDoUsuario,
  type Destinador,
  type Residuo,
  type SaidaDeResiduo,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import {
  FormularioDeResiduo,
  FormularioDeSaida,
  RegistrarCdf,
} from "./formularios";

export const metadata: Metadata = { title: "Resíduos" };
const AVISOS: Record<string, string> = {
  residuo: "Resíduo cadastrado.",
  saida: "Saída registrada. Cobre o CDF do destinador em até 30 dias.",
  cdf: "CDF registrado.",
};
const qtd = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export default async function Residuos({
  searchParams,
}: PageProps<"/ambiental/residuos">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [rs, ss, eu, ds] = await Promise.all([
    chamarApi<Residuo[]>("/residuos"),
    chamarApi<SaidaDeResiduo[]>("/residuos/saidas"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
    chamarApi<Destinador[]>("/destinadores"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("ambiental.editar");
  const semCdf = ss.ok ? ss.dados.filter((s) => !s.cdfNumero) : [];
  const atrasados = semCdf.filter((s) => s.cdfAtrasado).length;
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={tituloDaPagina}>Resíduos</h1>
        <nav aria-label="Resíduos" className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/ambiental/destinadores"
            className="text-info hover:underline"
          >
            Transportadores e destinadores
          </Link>
          <Link
            href="/ambiental/residuos/inventario"
            className="text-info hover:underline"
          >
            Inventário anual e planilha do MTR
          </Link>
        </nav>
      </div>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Inventário por classe (NBR 10004) e cada saída com o MTR. O destinador
        devolve o CDF; passados 30 dias sem ele, a saída fica atrasada e aparece
        nos vencimentos.
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      {podeEditar && (
        <>
          {rs.ok && rs.dados.length > 0 && (
            <Recolhido titulo="Registrar saída com MTR">
              <FormularioDeSaida
                residuos={rs.dados}
                destinadores={ds.ok ? ds.dados : []}
              />
            </Recolhido>
          )}
          <Recolhido titulo="Cadastrar resíduo">
            <FormularioDeResiduo />
          </Recolhido>
        </>
      )}
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Inventário</h2>
        {!rs.ok ? (
          <div className="p-5">
            <AvisoDeErro erro={rs.erro} />
          </div>
        ) : rs.dados.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhum resíduo cadastrado.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Resíduo</th>
                  <th className="px-4 py-2 font-semibold">Classe</th>
                  <th className="px-4 py-2 font-semibold">Origem</th>
                  <th className="px-4 py-2 font-semibold">Armazenamento</th>
                  <th className="px-4 py-2 font-semibold">Destinação</th>
                  <th className="px-4 py-2 text-right font-semibold">
                    Saiu no ano
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {rs.dados.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-2.5">{r.nome}</td>
                    <td
                      className={`px-4 py-2.5 whitespace-nowrap ${r.classe === "I" ? "font-semibold" : ""}`}
                    >
                      {CLASSES_RESIDUO[r.classe]}
                    </td>
                    <td className="px-4 py-2.5 text-texto-2">{r.origem}</td>
                    <td className="px-4 py-2.5 text-texto-2">
                      {r.acondicionamento}
                    </td>
                    <td className="px-4 py-2.5 text-texto-2">{r.destinacao}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {qtd(r.quantidadeNoAno)} {UNIDADES_RESIDUO[r.unidade]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className={`${painel} mt-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className={tituloDaSecao}>Saídas</h2>
          {ss.ok && semCdf.length > 0 && (
            <p
              className={`inline-flex items-center gap-1.5 text-sm ${atrasados ? "text-nao-conforme" : "text-texto-2"}`}
            >
              {atrasados > 0 && (
                <CircleAlert aria-hidden size={14} strokeWidth={2} />
              )}
              {semCdf.length} sem CDF
              {atrasados ? ` · ${atrasados} atrasados` : ""}
            </p>
          )}
        </div>
        {!ss.ok ? (
          <div className="p-5">
            <AvisoDeErro erro={ss.erro} />
          </div>
        ) : ss.dados.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhuma saída registrada.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Resíduo</th>
                  <th className="px-4 py-2 text-right font-semibold">
                    Quantidade
                  </th>
                  <th className="px-4 py-2 font-semibold">MTR</th>
                  <th className="px-4 py-2 font-semibold">
                    Transportador · destinador
                  </th>
                  <th className="px-4 py-2 font-semibold">CDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {ss.dados.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      {formatarData(s.data)}
                    </td>
                    <td className="px-4 py-2.5">{s.residuoNome}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {qtd(s.quantidade)} {UNIDADES_RESIDUO[s.unidade]}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm">{s.mtr}</td>
                    <td className="px-4 py-2.5 text-texto-2">
                      {s.transportador} · {s.destinador}
                      {s.custo !== null && (
                        <span className="block text-sm">
                          R${" "}
                          {s.custo.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.cdfNumero ? (
                        <span className="whitespace-nowrap">
                          {s.cdfNumero} · {formatarData(s.cdfData!)}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {s.cdfAtrasado && (
                            <span className="text-sm text-nao-conforme">
                              Atrasado (mais de 30 dias)
                            </span>
                          )}
                          {podeEditar ? (
                            <RegistrarCdf saidaId={s.id} />
                          ) : (
                            !s.cdfAtrasado && (
                              <span className="text-texto-2">Aguardando</span>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
