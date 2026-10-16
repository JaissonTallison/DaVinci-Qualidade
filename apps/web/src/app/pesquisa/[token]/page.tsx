import type { Metadata } from "next";
import Image from "next/image";
import type { PesquisaPublica } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { FormularioDaPesquisa } from "./formulario";

export const metadata: Metadata = {
  title: "Pesquisa de satisfação",
  robots: { index: false },
};

/** Página pública: o cliente responde a pesquisa pelo link recebido, sem login. */
export default async function Pesquisa({
  params,
  searchParams,
}: PageProps<"/pesquisa/[token]">) {
  const { token } = await params;
  const { obrigado } = (await searchParams) as { obrigado?: string };
  const r = await chamarApi<PesquisaPublica>(
    `/pesquisas/publica/${encodeURIComponent(token)}`,
    { publica: true },
  );
  return (
    <main
      id="conteudo"
      className="flex flex-1 flex-col items-center px-4 py-12"
    >
      <div className="w-full max-w-xl">
        <Image
          className="h-auto w-[160px]"
          src="/brand/logo.svg"
          alt="DaVinci Qualidade"
          width={573}
          height={215}
          priority
        />
        {!r.ok ? (
          <p className="mt-10 text-base">{r.erro.mensagem}</p>
        ) : obrigado || r.dados.situacao === "respondida" ? (
          <section className="mt-10">
            <h1 className="text-2xl">Obrigado pela resposta</h1>
            <p className="mt-2 text-base text-texto-2">
              Sua avaliação já foi registrada. Ela nos ajuda a melhorar o
              serviço.
            </p>
          </section>
        ) : r.dados.situacao === "expirada" ? (
          <section className="mt-10">
            <h1 className="text-2xl">Este link expirou</h1>
            <p className="mt-2 text-base text-texto-2">
              Peça um novo link a quem enviou a pesquisa.
            </p>
          </section>
        ) : (
          <section className="mt-10">
            <h1 className="text-2xl">Pesquisa de satisfação</h1>
            <p className="mt-2 text-base text-texto-2">
              {r.dados.clienteNome}
              {r.dados.osNumero &&
                ` · ${r.dados.osNumero}: ${r.dados.osTitulo}`}
            </p>
            <FormularioDaPesquisa
              token={token}
              comOs={Boolean(r.dados.osNumero)}
            />
          </section>
        )}
      </div>
    </main>
  );
}
