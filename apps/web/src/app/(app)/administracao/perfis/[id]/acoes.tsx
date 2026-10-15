"use client";

import type { Perfil } from "@davinci/types";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  exigir2faNoPerfil,
  mudarSituacaoDoPerfil,
} from "@/lib/acoes-administracao";

export function DuasEtapas({ perfil }: { perfil: Perfil }) {
  return (
    <Recolhido
      titulo={
        perfil.exige2fa
          ? "Deixar de exigir duas etapas"
          : "Exigir verificação em duas etapas"
      }
    >
      <p className="text-base text-texto-2">
        {perfil.exige2fa
          ? "Quem usa este perfil volta a entrar só com a senha, se quiser."
          : "Quem usa este perfil precisa ativar a verificação em duas etapas para entrar."}
      </p>
      <Formulario
        acao={exigir2faNoPerfil.bind(null, perfil.id)}
        versao={perfil.versao}
        rotuloDoBotao={
          perfil.exige2fa ? "Deixar de exigir" : "Exigir duas etapas"
        }
      >
        {() => (
          <input
            type="hidden"
            name="exige"
            value={perfil.exige2fa ? "nao" : "sim"}
          />
        )}
      </Formulario>
    </Recolhido>
  );
}

export function SituacaoDoPerfil({ perfil }: { perfil: Perfil }) {
  return (
    <Recolhido titulo={perfil.ativo ? "Inativar perfil" : "Reativar perfil"}>
      <p className="text-base text-texto-2">
        {perfil.ativo
          ? "Perfil com usuário ativo não se inativa: troque o perfil dessas pessoas antes."
          : "Ativo, o perfil volta para a escolha no cadastro de usuários."}
      </p>
      <Formulario
        acao={mudarSituacaoDoPerfil.bind(null, perfil.id)}
        versao={perfil.versao}
        rotuloDoBotao={perfil.ativo ? "Inativar perfil" : "Reativar perfil"}
        perigo={perfil.ativo}
      >
        {() => (
          <input
            type="hidden"
            name="ativar"
            value={perfil.ativo ? "nao" : "sim"}
          />
        )}
      </Formulario>
    </Recolhido>
  );
}
