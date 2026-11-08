import { notFound } from "next/navigation";
import { type DadosDoUsuario, type RiscoOuOportunidade } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { ClasseDoRo } from "@/components/marcadores";
import { chamarApi } from "@/lib/api";
import { formatarData, formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { Dado } from "../dado";
import { EncerrarRo } from "./acoes";
import type { ConfigRo } from "./config";
import { FormularioDeRo } from "./formulario";

import { CabecalhoComVoltar } from "@/components/pagina-de-cadastro";
const AVISOS = {
  criado: "Registrado.",
  salvo: "Salvo.",
  encerrado: "Encerrado com o resultado.",
} as Record<string, string>;

export async function DetalheDoRo({
  cfg,
  id,
  searchParams,
}: {
  cfg: ConfigRo;
  id: string;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, eu] = await Promise.all([
    chamarApi<RiscoOuOportunidade>(`/riscos-e-oportunidades/${id}`),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const x = r.dados;
  const podeEditar =
    eu.ok && eu.dados.permissoes.includes("sgi.editar") && !x.encerradoEm;
  return (
    <article>
      <CabecalhoComVoltar voltar={{ href: cfg.base, rotulo: cfg.titulo }}>
        <header className="flex flex-wrap items-baseline gap-x-4">
          <span className="text-texto-2">{cfg.classe}:</span>
          <ClasseDoRo classe={x.classe} />
          <span className="text-texto-2">
            {x.processo}
            {x.encerradoEm ? " · Encerrado" : ""}
          </span>
        </header>
        <h1 className={`${tituloDaPagina} mt-1`}>{x.descricao}</h1>
        <Aviso avisos={AVISOS} chave={aviso} />
      </CabecalhoComVoltar>
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {x.contexto && (
            <Dado rotulo={cfg.contexto} largo>
              {x.contexto}
            </Dado>
          )}
          <Dado rotulo={`${cfg.eixoA.rotulo} × ${cfg.eixoB.rotulo}`}>
            {x.probabilidade} × {x.impacto}
          </Dado>
          {x.responsavel && <Dado rotulo="Responsável">{x.responsavel}</Dado>}
          {x.prazo && (
            <Dado rotulo="Prazo">
              <span className={x.prazoVencido ? "text-nao-conforme" : ""}>
                {formatarData(x.prazo)}
                {x.prazoVencido && " · vencido"}
              </span>
            </Dado>
          )}
          {cfg.controles && x.controlesExistentes && (
            <Dado rotulo={cfg.controles} largo>
              {x.controlesExistentes}
            </Dado>
          )}
          {x.acao && (
            <Dado rotulo={cfg.acao} largo>
              {x.acao}
            </Dado>
          )}
          {x.resultado && (
            <Dado
              rotulo={`${cfg.resultado} (encerrado em ${formatarMomento(x.encerradoEm!)})`}
              largo
            >
              {x.resultado}
            </Dado>
          )}
        </dl>
      </section>
      {podeEditar && <EncerrarRo cfg={cfg} ro={x} />}
      {podeEditar && (
        <Recolhido titulo="Reavaliar ou corrigir">
          <FormularioDeRo cfg={cfg} ro={x} embutido />
        </Recolhido>
      )}
    </article>
  );
}
