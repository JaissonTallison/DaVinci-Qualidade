"use client";

import { useActionState } from "react";
import type { Treinamento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  mudarSituacaoDoTreinamento,
  salvarTreinamento,
} from "@/lib/acoes-exames-e-treinamentos";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeTreinamento({
  treinamento,
}: {
  treinamento?: Treinamento;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarTreinamento.bind(null, treinamento?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    nome: treinamento?.nome ?? "",
    norma: treinamento?.norma ?? "",
    cargaHoraria: treinamento ? String(treinamento.cargaHoraria) : "",
    validadeMeses: treinamento?.validadeMeses
      ? String(treinamento.validadeMeses)
      : "",
  };
  const sufixo = treinamento?.id ?? "novo";
  return (
    <form action={acao} noValidate className="flex flex-col gap-4">
      {treinamento && (
        <input type="hidden" name="versao" value={treinamento.versao} />
      )}
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo
          id={`nome-${sufixo}`}
          rotulo="Nome"
          erro={erros.nome}
          className="sm:col-span-2"
        >
          <input
            id={`nome-${sufixo}`}
            name="nome"
            maxLength={120}
            defaultValue={v.nome}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo
          id={`norma-${sufixo}`}
          rotulo="Norma (opcional)"
          erro={erros.norma}
          ajuda="Ex.: NR-35"
        >
          <input
            id={`norma-${sufixo}`}
            name="norma"
            maxLength={30}
            defaultValue={v.norma}
            className={campo}
          />
        </Campo>
        <Campo
          id={`carga-${sufixo}`}
          rotulo="Carga horária (h)"
          erro={erros.cargaHoraria}
        >
          <input
            id={`carga-${sufixo}`}
            name="cargaHoraria"
            inputMode="numeric"
            defaultValue={v.cargaHoraria}
            className={campo}
            aria-invalid={Boolean(erros.cargaHoraria)}
          />
        </Campo>
        <Campo
          id={`validade-${sufixo}`}
          rotulo="Validade em meses (opcional)"
          erro={erros.validadeMeses}
          ajuda="Em branco: não vence."
          className="sm:col-span-2"
        >
          <input
            id={`validade-${sufixo}`}
            name="validadeMeses"
            inputMode="numeric"
            defaultValue={v.validadeMeses}
            className={`${campo} sm:w-40`}
            aria-invalid={Boolean(erros.validadeMeses)}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : treinamento
              ? "Salvar treinamento"
              : "Cadastrar treinamento"}
        </button>
      </div>
    </form>
  );
}

export function SituacaoDoTreinamento({
  treinamento,
}: {
  treinamento: Treinamento;
}) {
  return (
    <Formulario
      acao={mudarSituacaoDoTreinamento.bind(null, treinamento.id)}
      versao={treinamento.versao}
      rotuloDoBotao={treinamento.ativo ? "Inativar" : "Reativar"}
      perigo={treinamento.ativo}
    >
      {() => (
        <input
          type="hidden"
          name="ativo"
          value={treinamento.ativo ? "nao" : "sim"}
        />
      )}
    </Formulario>
  );
}
