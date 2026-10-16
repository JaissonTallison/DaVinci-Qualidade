"use client";

import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { registrarProducao } from "@/lib/acoes-ambiental-gestao";
import { campo } from "@/lib/estilos";

/** Produção do mês: um registro por mês; registrar de novo substitui. */
export function RegistrarProducao({
  mes,
  unidade,
}: {
  mes: string;
  unidade: string | null;
}) {
  return (
    <Formulario
      acao={registrarProducao}
      versao=""
      rotuloDoBotao="Registrar produção"
    >
      {(erros, v) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="competencia" rotulo="Mês" erro={erros.competencia}>
            <input
              id="competencia"
              name="competencia"
              type="month"
              max={mes}
              defaultValue={v.competencia ?? mes}
              className={campo}
            />
          </Campo>
          <Campo
            id="quantidade"
            rotulo="Quantidade produzida"
            erro={erros.quantidade}
          >
            <input
              id="quantidade"
              name="quantidade"
              inputMode="decimal"
              defaultValue={v.quantidade}
              className={campo}
            />
          </Campo>
          <Campo
            id="unidade"
            rotulo="Unidade"
            erro={erros.unidade}
            ajuda="t, peças, m², litros..."
          >
            <input
              id="unidade"
              name="unidade"
              maxLength={20}
              defaultValue={v.unidade ?? unidade ?? ""}
              className={campo}
            />
          </Campo>
        </div>
      )}
    </Formulario>
  );
}
