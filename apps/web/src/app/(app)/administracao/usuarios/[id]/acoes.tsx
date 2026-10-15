"use client";

import { useActionState } from "react";
import type { Perfil, UsuarioDaEmpresa } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  alterarPerfilDoUsuario,
  desativar2faDoUsuario,
  devolverAcesso,
  redefinirSenha,
  removerAcesso,
  type EstadoComSenha,
} from "@/lib/acoes-administracao";
import type { EstadoDaAcao } from "@/lib/acao";
import { botaoPerigo, botaoSecundario, campo } from "@/lib/estilos";
import { SenhaProvisoria } from "../../senha-provisoria";

export function TrocarPerfil({
  usuario,
  perfis,
}: {
  usuario: UsuarioDaEmpresa;
  perfis: Perfil[];
}) {
  return (
    <Recolhido titulo="Trocar o perfil">
      <Formulario
        acao={alterarPerfilDoUsuario.bind(null, usuario.id)}
        versao={usuario.versao}
        rotuloDoBotao="Salvar perfil"
      >
        {(erros, v) => (
          <Campo
            id="perfilId"
            rotulo="Perfil"
            erro={erros.perfilId}
            className="sm:w-80"
          >
            <Selecao
              id="perfilId"
              name="perfilId"
              defaultValue={v.perfilId ?? usuario.perfil.id}
              className={campo}
            >
              {perfis
                .filter((p) => p.ativo || p.id === usuario.perfil.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </Selecao>
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}

export function RemoverAcesso({ usuario }: { usuario: UsuarioDaEmpresa }) {
  return (
    <Recolhido titulo="Tirar o acesso">
      <p className="text-base text-texto-2">
        A pessoa deixa de entrar nesta empresa na hora. O que ela registrou
        continua no sistema.
      </p>
      <Formulario
        acao={removerAcesso.bind(null, usuario.id)}
        versao={usuario.versao}
        rotuloDoBotao="Tirar o acesso"
        perigo
      >
        {(erros, v) => (
          <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
            <input
              id="motivo"
              name="motivo"
              maxLength={500}
              defaultValue={v.motivo}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}

export function DevolverAcesso({ usuario }: { usuario: UsuarioDaEmpresa }) {
  return (
    <Recolhido titulo="Devolver o acesso">
      <Formulario
        acao={devolverAcesso.bind(null, usuario.id)}
        versao={usuario.versao}
        rotuloDoBotao="Devolver o acesso"
      >
        {() => null}
      </Formulario>
    </Recolhido>
  );
}

export function RedefinirSenha({ usuario }: { usuario: UsuarioDaEmpresa }) {
  const [estado, enviar, enviando] = useActionState<EstadoComSenha>(
    redefinirSenha.bind(null, usuario.id),
    {},
  );
  return (
    <Recolhido titulo="Gerar senha provisória">
      <p className="text-base text-texto-2">
        Para quem esqueceu a senha e não consegue recuperar pelo e-mail. A senha
        atual deixa de valer.
      </p>
      {estado.erro && (
        <div className="mt-3">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
      {estado.senha ? (
        <SenhaProvisoria senha={estado.senha} />
      ) : (
        <form action={enviar} className="mt-4">
          <button type="submit" className={botaoSecundario} disabled={enviando}>
            Gerar senha provisória
          </button>
        </form>
      )}
    </Recolhido>
  );
}

export function Desativar2fa({ usuario }: { usuario: UsuarioDaEmpresa }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao>(
    desativar2faDoUsuario.bind(null, usuario.id),
    {},
  );
  return (
    <Recolhido titulo="Desativar a verificação em duas etapas">
      <p className="text-base text-texto-2">
        Para quem perdeu o celular e os códigos de recuperação. A pessoa entra
        só com a senha e ativa de novo.
      </p>
      {estado.erro && (
        <div className="mt-3">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
      <form action={enviar} className="mt-4">
        <button type="submit" className={botaoPerigo} disabled={enviando}>
          Desativar duas etapas
        </button>
      </form>
    </Recolhido>
  );
}
