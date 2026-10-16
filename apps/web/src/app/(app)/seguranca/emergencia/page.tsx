import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  PAPEIS_NA_BRIGADA,
  type Brigadista,
  type DadosDoUsuario,
  type FuncionarioResumo,
  type Pagina,
  type PlanoDeEmergencia,
} from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento, hojeEmBrasilia } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import {
  NovoBrigadista,
  PlanoDeEmergenciaForm,
  RetirarBrigadista,
} from "./formularios";

export const metadata: Metadata = { title: "Brigada e plano de emergência" };

/** Brigada (NBR 14276) com a validade do treinamento e o plano de emergência da empresa. */
export default async function Emergencia({
  searchParams,
}: PageProps<"/seguranca/emergencia">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [brigada, plano, eu] = await Promise.all([
    chamarApi<Brigadista[]>("/brigada"),
    chamarApi<PlanoDeEmergencia | null>("/plano-de-emergencia"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  const funcionarios = podeEditar
    ? await chamarApi<Pagina<FuncionarioResumo>>(
        "/funcionarios?situacao=ativos&porPagina=100",
      )
    : null;
  const p = plano.ok ? plano.dados : null;
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={tituloDaPagina}>Brigada e plano de emergência</h1>
        {p && (
          <Link
            href="/seguranca/emergencia/imprimir"
            className={botaoSecundario}
          >
            <Printer aria-hidden size={16} strokeWidth={2} />
            Plano para imprimir
          </Link>
        )}
      </div>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Quem atua numa emergência, com o treinamento em dia (reciclagem anual),
        e o que fazer em cada cenário. Os simulados ficam em DDS, APR, CIPA e
        simulados.
      </p>
      <Aviso
        avisos={{
          brigadista: "Brigadista incluído.",
          plano: "Plano de emergência salvo.",
        }}
        chave={aviso}
      />
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Brigada de emergência</h2>
        {!brigada.ok ? (
          <div className="p-5">
            <AvisoDeErro erro={brigada.erro} />
          </div>
        ) : brigada.dados.length === 0 ? (
          <p className="px-5 py-5 text-base text-texto-2">Nenhum brigadista.</p>
        ) : (
          <ul className="mt-3 divide-y divide-borda border-t border-borda">
            {brigada.dados.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5"
              >
                <span className="text-base">
                  {b.nome}{" "}
                  <span className="text-sm text-texto-2">
                    · {PAPEIS_NA_BRIGADA[b.papel]} · {b.setor}
                    {b.turno && ` · ${b.turno}`}
                  </span>
                </span>
                <span className="flex items-center gap-4 text-sm">
                  <span
                    className={
                      b.vencido
                        ? "font-semibold text-nao-conforme"
                        : "text-texto-2"
                    }
                  >
                    Treinamento válido até {formatarData(b.validade)}
                  </span>
                  {podeEditar && <RetirarBrigadista b={b} />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {podeEditar && funcionarios?.ok && (
        <Recolhido titulo="Incluir na brigada">
          <NovoBrigadista
            funcionarios={funcionarios.dados.itens}
            hoje={hojeEmBrasilia()}
          />
        </Recolhido>
      )}
      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Plano de emergência</h2>
        {p && (
          <p className="text-sm text-texto-2">
            Revisado em {formatarMomento(p.revisadoEm)}
          </p>
        )}
        {podeEditar ? (
          <PlanoDeEmergenciaForm plano={p} />
        ) : p ? (
          <p className="mt-2 text-base whitespace-pre-line">
            {p.procedimentos}
          </p>
        ) : (
          <p className="mt-2 text-base text-texto-2">
            Plano ainda não preenchido.
          </p>
        )}
      </section>
    </>
  );
}
