import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import type { Perfil } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { botaoPrimario, painel, tituloDaPagina } from "@/lib/estilos";

export const metadata: Metadata = { title: "Perfis de acesso" };

export default async function Perfis() {
  const lista = await chamarApi<Perfil[]>("/perfis");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Perfis de acesso</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Cada usuário tem um perfil, e o perfil diz o que ele pode ver e
            fazer.
          </p>
        </div>
        <Link href="/administracao/perfis/novo" className={botaoPrimario}>
          <IconeDaTela href={"/administracao/perfis/novo"} />
          Criar perfil
        </Link>
      </header>
      <section className={`${painel} mt-6`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.dados.map((p) => (
              <li
                key={p.id}
                className={`flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 ${p.ativo ? "" : "text-texto-3"}`}
              >
                <div>
                  <Link
                    href={`/administracao/perfis/${p.id}`}
                    className="font-medium text-info hover:underline"
                  >
                    {p.nome}
                  </Link>
                  {p.descricao && (
                    <p className="text-sm text-texto-2">{p.descricao}</p>
                  )}
                </div>
                <p className="text-sm text-texto-2">
                  {[
                    p.ativo ? null : "Inativo",
                    p.protegido ? "Não pode ser alterado" : null,
                    p.exige2fa ? "Exige duas etapas" : null,
                    `${p.permissoes.length} ${p.permissoes.length === 1 ? "permissão" : "permissões"}`,
                    `${p.usuarios} ${p.usuarios === 1 ? "usuário" : "usuários"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
