import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Perfil, UsuarioDaEmpresa } from "@davinci/types";
import { Aviso } from "@/components/aviso";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import {
  Desativar2fa,
  DevolverAcesso,
  RedefinirSenha,
  RemoverAcesso,
  TrocarPerfil,
} from "./acoes";

export const metadata: Metadata = { title: "Usuário" };

const AVISOS: Record<string, string> = {
  perfil: "Perfil alterado. Vale a partir do próximo acesso da pessoa.",
  removido: "Acesso retirado.",
  devolvido: "Acesso devolvido.",
  "2fa": "Verificação em duas etapas desativada.",
};

export default async function DetalheDoUsuario({
  params,
  searchParams,
}: PageProps<"/administracao/usuarios/[id]">) {
  const { id } = await params;
  const { aviso } = (await searchParams) as { aviso?: string };
  const [r, perfis] = await Promise.all([
    chamarApi<UsuarioDaEmpresa>(`/usuarios/${id}`),
    chamarApi<Perfil[]>("/perfis"),
  ]);
  if (!r.ok && r.erro.codigo === "NAO_ENCONTRADO") notFound();
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const u = r.dados;
  return (
    <article className="max-w-5xl">
      <Link
        href="/administracao/usuarios"
        className="text-sm text-texto-2 hover:underline"
      >
        Usuários
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>{u.nome}</h1>
      <Aviso avisos={AVISOS} chave={aviso} />
      <section className={`${painel} mt-6 p-5`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <Dado rotulo="E-mail">{u.email}</Dado>
          <Dado rotulo="Perfil">{u.perfil.nome}</Dado>
          <Dado rotulo="Situação">
            {u.ativo
              ? u.deveTrocarSenha
                ? "Ativo, com senha provisória"
                : "Ativo"
              : `Sem acesso: ${u.motivoInativacao ?? ""}`}
          </Dado>
          <Dado rotulo="Último acesso">
            {u.ultimoAcessoEm
              ? formatarMomento(u.ultimoAcessoEm)
              : "Nunca entrou"}
          </Dado>
          <Dado rotulo="Duas etapas">
            {u.doisFatores ? "Ativa" : "Não usa"}
          </Dado>
          {u.acessaOutrasEmpresas && (
            <Dado rotulo="Outras empresas">Também acessa outras empresas</Dado>
          )}
        </dl>
      </section>
      {u.euMesmo ? (
        <p className="mt-6 text-base text-texto-2">
          Este é o seu usuário: o seu perfil e o seu acesso são alterados por
          outro administrador.
        </p>
      ) : u.ativo ? (
        <>
          {perfis.ok && <TrocarPerfil usuario={u} perfis={perfis.dados} />}
          {!u.acessaOutrasEmpresas && <RedefinirSenha usuario={u} />}
          {u.doisFatores && <Desativar2fa usuario={u} />}
          <RemoverAcesso usuario={u} />
        </>
      ) : (
        <DevolverAcesso usuario={u} />
      )}
    </article>
  );
}

function Dado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}
