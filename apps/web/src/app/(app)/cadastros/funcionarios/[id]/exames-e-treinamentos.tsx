import Link from "next/link";
import {
  RESULTADOS_ASO,
  TIPOS_ASO,
  type Aso,
  type Funcionario,
  type TreinamentoRealizado,
} from "@davinci/types";
import { AnularRegistro } from "@/components/anular-registro";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Validade } from "@/components/situacao-do-vencimento";
import { chamarApi } from "@/lib/api";
import {
  anularAso,
  anularTreinamentoRealizado,
} from "@/lib/acoes-exames-e-treinamentos";
import { formatarData } from "@/lib/datas";
import { botaoSecundario, painel, tituloDaSecao } from "@/lib/estilos";
import { RegistrarAso } from "./registrar-aso";

/** Exames ocupacionais e treinamentos da pessoa. O vigente é o mais recente; os antigos ficam como histórico. */
export async function ExamesETreinamentos({
  f,
  podeEditar,
}: {
  f: Funcionario;
  podeEditar: boolean;
}) {
  const [asos, realizados] = await Promise.all([
    chamarApi<Aso[]>(`/asos?funcionarioId=${f.id}`),
    chamarApi<TreinamentoRealizado[]>(
      `/treinamentos/realizados?funcionarioId=${f.id}`,
    ),
  ]);
  const asoVigente = asos.ok
    ? asos.dados.find((a) => !a.motivoAnulacao)
    : undefined;
  return (
    <>
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>
          Exames ocupacionais (ASO)
        </h2>
        {!asos.ok ? (
          <div className="p-5">
            <AvisoDeErro erro={asos.erro} />
          </div>
        ) : asos.dados.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhum exame registrado.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Resultado</th>
                  <th className="px-4 py-2 font-semibold">Próximo exame</th>
                  <th className="px-4 py-2 font-semibold">Médico</th>
                  {podeEditar && (
                    <th className="px-4 py-2">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {asos.dados.map((a) => {
                  const anulado = Boolean(a.motivoAnulacao);
                  return (
                    <tr key={a.id} className={anulado ? "text-texto-3" : ""}>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span className={anulado ? "line-through" : ""}>
                          {formatarData(a.data)}
                        </span>
                        {anulado && (
                          <span className="block max-w-xs text-xs">
                            Anulado: {a.motivoAnulacao}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{TIPOS_ASO[a.tipo]}</td>
                      <td
                        className={`px-4 py-2.5 ${!anulado && a.resultado === "inapto" ? "font-semibold text-nao-conforme" : ""}`}
                      >
                        {RESULTADOS_ASO[a.resultado]}
                        {a.observacao && (
                          <span className="block text-xs text-texto-2">
                            {a.observacao}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {!a.proximoExame ? (
                          "—"
                        ) : a === asoVigente ? (
                          <Validade validade={a.proximoExame} />
                        ) : (
                          formatarData(a.proximoExame)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-texto-2">
                        {[a.medico, a.crm && `CRM ${a.crm}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </td>
                      {podeEditar && (
                        <td className="px-4 py-2.5 text-right">
                          {!anulado && (
                            <AnularRegistro
                              id={a.id}
                              acao={anularAso.bind(null, a.id, f.id)}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {podeEditar && (
          <div className="px-5 pb-5">
            {asos.ok && <RegistrarAso funcionarioId={f.id} versao={f.versao} />}
          </div>
        )}
      </section>

      <section className={`${painel} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <h2 className={tituloDaSecao}>Treinamentos</h2>
          {podeEditar && f.ativo && (
            <Link
              href={`/cadastros/treinamentos/turma?funcionario=${f.id}`}
              className={botaoSecundario}
            >
              Registrar treinamento
            </Link>
          )}
        </div>
        {!realizados.ok ? (
          <div className="p-5">
            <AvisoDeErro erro={realizados.erro} />
          </div>
        ) : realizados.dados.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhum treinamento registrado.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Data</th>
                  <th className="px-4 py-2 font-semibold">Treinamento</th>
                  <th className="px-4 py-2 font-semibold">Carga</th>
                  <th className="px-4 py-2 font-semibold">Validade</th>
                  <th className="px-4 py-2 font-semibold">Instrutor</th>
                  {podeEditar && (
                    <th className="px-4 py-2">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {realizados.dados.map((t) => {
                  const anulado = Boolean(t.motivoAnulacao);
                  const maisRecente =
                    realizados.dados.find(
                      (x) =>
                        x.treinamentoId === t.treinamentoId &&
                        !x.motivoAnulacao,
                    ) === t;
                  return (
                    <tr key={t.id} className={anulado ? "text-texto-3" : ""}>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <span className={anulado ? "line-through" : ""}>
                          {formatarData(t.data)}
                        </span>
                        {anulado && (
                          <span className="block max-w-xs text-xs">
                            Anulado: {t.motivoAnulacao}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {t.treinamentoNome}
                        {t.norma && (
                          <span className="ml-1.5 text-sm text-texto-2">
                            {t.norma}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {t.cargaHoraria} h
                      </td>
                      <td className="px-4 py-2.5">
                        {!t.validade ? (
                          "Sem validade"
                        ) : maisRecente ? (
                          <Validade validade={t.validade} />
                        ) : (
                          formatarData(t.validade)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-texto-2">
                        {t.instrutor}
                      </td>
                      {podeEditar && (
                        <td className="px-4 py-2.5 text-right">
                          {!anulado && (
                            <AnularRegistro
                              id={t.id}
                              acao={anularTreinamentoRealizado.bind(
                                null,
                                t.id,
                                f.id,
                              )}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
