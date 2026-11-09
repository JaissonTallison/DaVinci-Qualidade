import type { Metadata } from "next";
import type { ConfiguracaoDaQualidade } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { chamarApi } from "@/lib/api";
import { FormularioDeEficacia } from "./formulario";

export const metadata: Metadata = { title: "Verificação de eficácia" };

/** Configuração da segregação de função na verificação de eficácia das NCs (ERR-09). */
export default async function ConfiguracaoDeEficacia({
  searchParams,
}: PageProps<"/qualidade/configuracoes/eficacia">) {
  const { aviso } = (await searchParams) as { aviso?: string };
  const r = await chamarApi<ConfiguracaoDaQualidade>(
    "/nao-conformidades/configuracao",
  );
  return (
    <>
      <CabecalhoDaPagina
        titulo="Verificação de eficácia"
        descricao="Quem define se a mesma pessoa que tratou a não conformidade pode verificar a própria eficácia."
        voltar={{
          href: "/qualidade/configuracoes",
          rotulo: "Configurações da qualidade",
        }}
      />
      {aviso === "salvo" && (
        <CaixaDeAlerta tom="sucesso" className="mt-4">
          Configuração salva.
        </CaixaDeAlerta>
      )}
      {r.ok ? (
        <FormularioDeEficacia auto={r.dados.autoVerificacaoEficacia} />
      ) : (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      )}
    </>
  );
}
