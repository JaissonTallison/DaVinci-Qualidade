import type { Metadata } from "next";
import Link from "next/link";
import type { Perfil, UsuarioDaEmpresa } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Recolhido } from "@/components/formulario-de-acao";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { NovoUsuario } from "./novo-usuario";

export const metadata: Metadata = { title: "Usuários" };

export default async function Usuarios() {
  const [lista, perfis] = await Promise.all([
    chamarApi<UsuarioDaEmpresa[]>("/usuarios"),
    chamarApi<Perfil[]>("/perfis"),
  ]);
  return (
    <>
      <h1 className={tituloDaPagina}>Usuários</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Quem acessa o sistema nesta empresa e com qual perfil. Tirar o acesso
        não apaga nada do que a pessoa registrou.
      </p>
      {perfis.ok && (
        <Recolhido titulo="Cadastrar usuário">
          <NovoUsuario perfis={perfis.dados} />
        </Recolhido>
      )}
      <section className={`${painel} mt-6`}>
        {!lista.ok ? (
          <div className="p-4">
            <AvisoDeErro erro={lista.erro} />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-superficie-2 text-xs text-texto-2">
                <tr>
                  <th className="px-4 py-2 font-semibold">Nome</th>
                  <th className="px-4 py-2 font-semibold">E-mail</th>
                  <th className="px-4 py-2 font-semibold">Perfil</th>
                  <th className="px-4 py-2 font-semibold">Último acesso</th>
                  <th className="px-4 py-2 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {lista.dados.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-superficie-2 ${u.ativo ? "" : "text-texto-3"}`}
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/administracao/usuarios/${u.id}`}
                        className="font-medium text-info hover:underline"
                      >
                        {u.nome}
                      </Link>
                      {u.euMesmo && (
                        <span className="ml-2 text-sm text-texto-2">
                          (você)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-texto-2">{u.email}</td>
                    <td className="px-4 py-2">{u.perfil.nome}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-texto-2">
                      {u.ultimoAcessoEm
                        ? formatarMomento(u.ultimoAcessoEm)
                        : "Nunca entrou"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {!u.ativo ? (
                        "Sem acesso"
                      ) : u.deveTrocarSenha ? (
                        <span className="text-atencao">Senha provisória</span>
                      ) : (
                        "Ativo"
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
