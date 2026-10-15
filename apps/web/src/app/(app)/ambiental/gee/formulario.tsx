"use client";

import { useActionState } from "react";
import { FONTES_DE_CONSUMO, UNIDADE_DA_FONTE } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { definirFator } from "@/lib/acoes-ambiental";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Fator de emissão do ano: a empresa informa o valor e de onde ele veio. */
export function FormularioDeFator({ ano }: { ano: number }) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    definirFator,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={enviar} noValidate className="flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <input type="hidden" name="ano" value={ano} />
      <div className="grid gap-5 sm:grid-cols-4">
        <Campo id="fonte" rotulo="Fonte" erro={erros.fonte}>
          <Selecao
            id="fonte"
            name="fonte"
            defaultValue={v.fonte ?? ""}
            className={campo}
          >
            <option value="">Escolha</option>
            {Object.entries(FONTES_DE_CONSUMO)
              .filter(([k]) => k !== "agua")
              .map(([k, n]) => (
                <option key={k} value={k}>
                  {n} (kg CO₂e por{" "}
                  {UNIDADE_DA_FONTE[k as keyof typeof UNIDADE_DA_FONTE]})
                </option>
              ))}
          </Selecao>
        </Campo>
        <Campo
          id="fator"
          rotulo="Fator (kg CO₂e por unidade)"
          erro={erros.fator}
        >
          <input
            id="fator"
            name="fator"
            inputMode="decimal"
            defaultValue={v.fator}
            className={campo}
          />
        </Campo>
        <Campo
          id="referencia"
          rotulo="De onde veio o fator"
          erro={erros.referencia}
          className="sm:col-span-2"
        >
          <input
            id="referencia"
            name="referencia"
            maxLength={200}
            defaultValue={v.referencia}
            className={campo}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : `Salvar fator de ${ano}`}
        </button>
      </div>
    </form>
  );
}
