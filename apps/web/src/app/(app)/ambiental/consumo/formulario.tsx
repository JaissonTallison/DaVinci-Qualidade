"use client";

import { useActionState, useState } from "react";
import {
  FONTES_DE_CONSUMO,
  UNIDADE_DA_FONTE,
  type FonteDeConsumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarConsumo } from "@/lib/acoes-ambiental";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Leitura do mês. Registrar de novo o mesmo mês e fonte corrige o valor. */
export function FormularioDeConsumo({ mesAtual }: { mesAtual: string }) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarConsumo,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const [fonte, setFonte] = useState<FonteDeConsumo>(
    (v.fonte as FonteDeConsumo) ?? "energia",
  );
  return (
    <form action={enviar} noValidate className="mt-4 flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-5 sm:grid-cols-4">
        <Campo id="fonte" rotulo="Fonte" erro={erros.fonte}>
          <Selecao
            id="fonte"
            name="fonte"
            defaultValue={fonte}
            onChange={(e) => setFonte(e.target.value as FonteDeConsumo)}
            className={campo}
          >
            {Object.entries(FONTES_DE_CONSUMO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="competencia" rotulo="Mês" erro={erros.competencia}>
          <input
            id="competencia"
            name="competencia"
            type="month"
            max={mesAtual}
            defaultValue={v.competencia ?? mesAtual}
            className={campo}
          />
        </Campo>
        <Campo
          id="quantidade"
          rotulo={`Quantidade (${UNIDADE_DA_FONTE[fonte]})`}
          erro={erros.quantidade}
        >
          <input
            id="quantidade"
            name="quantidade"
            inputMode="decimal"
            defaultValue={v.quantidade}
            className={campo}
            aria-invalid={Boolean(erros.quantidade)}
          />
        </Campo>
        <Campo id="custo" rotulo="Custo em R$ (opcional)" erro={erros.custo}>
          <input
            id="custo"
            name="custo"
            inputMode="decimal"
            defaultValue={v.custo}
            className={campo}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
