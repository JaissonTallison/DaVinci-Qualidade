"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { registrarHoras, type EstadoDaAcao } from "@/lib/acoes-acidentes";
import {
  cabecalhoDoPainel,
  campo,
  painel,
  tituloDoPainel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

/** Horas-homem de um mês. Lançar de novo o mesmo mês corrige o valor. */
export function LancarHoras({
  mesSugerido,
  maximo,
}: {
  mesSugerido: string;
  maximo: string;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarHoras,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <section className={`${painel} mt-6`}>
      <header className={cabecalhoDoPainel}>
        <div className="min-w-0">
          <h2 className={tituloDoPainel}>Lançar horas trabalhadas</h2>
          <p className="text-sm text-texto-2">
            Soma das horas efetivamente trabalhadas por todos no mês (folha de
            ponto). Lançar de novo o mesmo mês corrige o valor.
          </p>
        </div>
      </header>
      <div className="p-5">
        <form
          action={acao}
          noValidate
          className="mt-4 flex flex-wrap items-end gap-5"
        >
          {erroGeral && <AvisoDeErro erro={erroGeral} />}
          <Campo
            id="competencia"
            rotulo="Mês"
            erro={erros.competencia}
            className="w-48"
          >
            <input
              id="competencia"
              name="competencia"
              type="month"
              max={maximo}
              defaultValue={estado.valores?.competencia ?? mesSugerido}
              className={campo}
              aria-invalid={Boolean(erros.competencia)}
            />
          </Campo>
          <Campo
            id="horas"
            rotulo="Horas-homem"
            erro={erros.horas}
            className="w-56"
          >
            <input
              id="horas"
              name="horas"
              inputMode="decimal"
              placeholder="Ex.: 38.720"
              defaultValue={estado.valores?.horas}
              className={campo}
              aria-invalid={Boolean(erros.horas)}
            />
          </Campo>
          <Botao
            type="submit"
            carregando={salvando}
            textoCarregando="Salvando…"
            variante="primario"
          >
            Lançar horas
          </Botao>
        </form>
      </div>
    </section>
  );
}
