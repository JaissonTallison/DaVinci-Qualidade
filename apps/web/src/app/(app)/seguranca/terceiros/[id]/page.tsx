import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatarDocumento,
  TIPOS_DOC_TERCEIRO,
  type DadosDoUsuario,
  type Terceiro,
} from "@davinci/types";
import { Anexos } from "@/components/anexos";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { Validade } from "@/components/situacao-do-vencimento";
import { chamarApi } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";
import { FormularioDeTerceiro } from "../formulario";
import { SituacaoDoTerceiro } from "../situacao";
import { RegistrarDocumento } from "./documento";

export const metadata: Metadata = { title: "Terceiro" };

const AVISOS: Record<string, string> = {
  criado:
    "Terceiro cadastrado. Registre PGR, PCMSO e ASO para liberar a entrada.",
  salvo: "Cadastro salvo.",
  documento: "Documento registrado.",
  anexado: "Arquivo anexado.",
  "anexo-removido": "Anexo removido.",
};

export default async function DetalheDoTerceiro({
  params,
  searchParams,
}: PageProps<"/seguranca/terceiros/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<Terceiro>(`/terceiros/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const t = r.dados;
  const podeEditar = eu.ok && eu.dados.permissoes.includes("seguranca.editar");
  return (
    <article>
      <Link
        href="/seguranca/terceiros"
        className="dv-voltar"
      >
        Terceiros
      </Link>
      <header className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg text-texto-2">
          {formatarDocumento(t.cnpj)}
        </span>
        <SituacaoDoTerceiro situacao={t.situacao} />
      </header>
      <h1 className={`${tituloDaPagina} mt-1`}>{t.razaoSocial}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      {t.pendencias.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-sm border border-nao-conforme bg-nao-conforme/10 px-4 py-2.5 text-base text-texto"
        >
          <p className="font-semibold">
            Não liberar a entrada enquanto houver pendência:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {t.pendencias.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <dt className="text-xs text-texto-2">Serviço</dt>
            <dd className="mt-0.5">{t.servico}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-2">Contrato</dt>
            <dd className="mt-0.5">
              {formatarData(t.inicioContrato)} a{" "}
              {t.fimContrato ? formatarData(t.fimContrato) : "sem data de fim"}
            </dd>
          </div>
          {t.contato && (
            <div>
              <dt className="text-xs text-texto-2">Contato</dt>
              <dd className="mt-0.5">{t.contato}</dd>
            </div>
          )}
        </dl>
      </section>
      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Documentos de SST</h2>
        {t.documentos.length === 0 ? (
          <p className="px-5 pt-2 pb-5 text-base text-texto-2">
            Nenhum documento registrado.
          </p>
        ) : (
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-sm text-texto-2">
                <tr>
                  <th className="px-5 py-2 font-semibold">Documento</th>
                  <th className="px-4 py-2 font-semibold">Válido até</th>
                  <th className="px-4 py-2 font-semibold">Registrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {t.documentos.map((d) => (
                  <tr key={d.id} className={d.vigente ? "" : "text-texto-3"}>
                    <td className="px-5 py-2.5">
                      {TIPOS_DOC_TERCEIRO[d.tipo]}
                      {d.descricao && (
                        <span className="block text-sm text-texto-2">
                          {d.descricao}
                        </span>
                      )}
                      {!d.vigente && (
                        <span className="block text-xs">Substituído</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {d.vigente ? (
                        <Validade validade={d.validade} />
                      ) : (
                        formatarData(d.validade)
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-texto-2">
                      {formatarData(d.registradoEm.slice(0, 10))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {podeEditar && (
          <div className="px-5 pb-5">
            <RegistrarDocumento id={t.id} versao={t.versao} />
          </div>
        )}
      </section>
      <Anexos
        registro="terceiro"
        registroId={t.id}
        voltar={`/seguranca/terceiros/${t.id}`}
        podeEditar={podeEditar}
      />
      {podeEditar && (
        <Recolhido titulo="Editar cadastro e contrato">
          <FormularioDeTerceiro terceiro={t} embutido />
        </Recolhido>
      )}
    </article>
  );
}
