import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PERMISSOES, type Perfil } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { FormularioDePerfil } from "../formulario";
import { DuasEtapas, SituacaoDoPerfil } from "./acoes";

export const metadata: Metadata = { title: "Perfil de acesso" };

const AVISOS: Record<string, string> = {
  criado:
    "Perfil criado. Agora ele aparece na escolha do cadastro de usuários.",
  salvo: "Perfil salvo. Vale a partir do próximo acesso de quem o usa.",
  "2fa-exigido":
    "A partir de agora, quem usa este perfil precisa da verificação em duas etapas.",
  "2fa-livre": "Este perfil deixou de exigir a verificação em duas etapas.",
  inativado: "Perfil inativado.",
  reativado: "Perfil reativado.",
};

export default async function DetalheDoPerfil({
  params,
  searchParams,
}: PageProps<"/administracao/perfis/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const r = await chamarApi<Perfil>(`/perfis/${id}`);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const p = r.dados;
  return (
    <article className="max-w-5xl">
      <Link
        href="/administracao/perfis"
        className="text-sm text-texto-2 hover:underline"
      >
        Perfis de acesso
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>{p.nome}</h1>
      <p className="mt-1 text-base text-texto-2">
        {p.usuarios} {p.usuarios === 1 ? "usuário usa" : "usuários usam"} este
        perfil
        {p.ativo ? "" : " · Inativo"}
      </p>
      <Aviso avisos={AVISOS} chave={aviso} />
      {p.protegido ? (
        <section className={`${painel} mt-6 p-5`}>
          <p className="text-base text-texto-2">
            O perfil Administrador tem todas as permissões e não pode ser
            alterado nem inativado.
          </p>
          <ul className="mt-3 columns-1 gap-8 text-sm text-texto md:columns-2">
            {p.permissoes.map((x) => (
              <li key={x} className="py-0.5">
                {PERMISSOES[x]}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        p.ativo && <FormularioDePerfil perfil={p} />
      )}
      <DuasEtapas perfil={p} />
      {!p.protegido && <SituacaoDoPerfil perfil={p} />}
    </article>
  );
}
