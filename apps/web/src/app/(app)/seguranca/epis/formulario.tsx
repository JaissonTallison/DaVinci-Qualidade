"use client";

import { useActionState } from "react";
import type { Epi } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarEpi } from "@/lib/acoes-epis";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cadastrar (sem `epi`) ou editar. Trocar o CA (lote novo) vale para as entregas daqui em diante. */
export function FormularioDeEpi({ epi }: { epi?: Epi }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarEpi.bind(null, epi?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    nome: epi?.nome ?? "",
    ca: epi?.ca ?? "",
    validadeCa: epi?.validadeCa ?? "",
    vidaUtilDias: epi?.vidaUtilDias ? String(epi.vidaUtilDias) : "",
  };
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form action={acao} noValidate className="flex flex-col gap-5">
      {epi && <input type="hidden" name="versao" value={epi.versao} />}
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      <div className="grid gap-5 sm:grid-cols-4">
        <Campo
          id="nome"
          rotulo="Nome do EPI"
          erro={erros.nome}
          ajuda="Ex.: Luva de vaqueta, Protetor auricular de espuma"
          className="sm:col-span-2"
        >
          <input
            id="nome"
            name="nome"
            defaultValue={v.nome}
            maxLength={120}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo id="ca" rotulo="Número do CA" erro={erros.ca}>
          <input
            id="ca"
            name="ca"
            inputMode="numeric"
            defaultValue={v.ca}
            maxLength={9}
            className={`${campo} font-mono`}
            aria-invalid={Boolean(erros.ca)}
          />
        </Campo>
        <Campo id="validadeCa" rotulo="Validade do CA" erro={erros.validadeCa}>
          <input
            id="validadeCa"
            name="validadeCa"
            type="date"
            defaultValue={v.validadeCa}
            className={campo}
            aria-invalid={Boolean(erros.validadeCa)}
          />
        </Campo>
        <Campo
          id="vidaUtilDias"
          rotulo="Vida útil em dias (opcional)"
          erro={erros.vidaUtilDias}
          ajuda="Com ela, cada entrega já sai com a data da próxima troca."
          className="sm:col-span-2"
        >
          <input
            id="vidaUtilDias"
            name="vidaUtilDias"
            inputMode="numeric"
            defaultValue={v.vidaUtilDias}
            maxLength={4}
            className={`${campo} sm:w-40`}
            aria-invalid={Boolean(erros.vidaUtilDias)}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : epi ? "Salvar EPI" : "Cadastrar EPI"}
        </button>
      </div>
    </form>
  );
}
