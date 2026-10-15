"use client";

import { useActionState } from "react";
import { CRITERIOS_FORNECEDOR, type ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { avaliarFornecedor } from "@/lib/acoes-servicos";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { EscolhaDeParceiro } from "../escolha-de-parceiro";

const NOTAS = {
  5: "5 · Excelente",
  4: "4 · Bom",
  3: "3 · Regular",
  2: "2 · Ruim",
  1: "1 · Péssimo",
};

export function FormularioDeAvaliacao({
  fornecedores,
}: {
  fornecedores: ParceiroResumo[];
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    avaliarFornecedor,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className="flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-5 sm:grid-cols-4">
        <Campo
          id="fornecedorId"
          rotulo="Fornecedor"
          erro={erros.fornecedorId}
          className="sm:col-span-3"
        >
          <EscolhaDeParceiro
            id="fornecedorId"
            parceiros={fornecedores}
            valor={v.fornecedorId}
            invalido={Boolean(erros.fornecedorId)}
          />
        </Campo>
        <Campo id="data" rotulo="Data" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            max={hojeEmBrasilia()}
            defaultValue={v.data ?? hojeEmBrasilia()}
            className={campo}
          />
        </Campo>
        {Object.entries(CRITERIOS_FORNECEDOR).map(([k, rotulo]) => (
          <Campo key={k} id={k} rotulo={rotulo} erro={erros[k]}>
            <Selecao
              id={k}
              name={k}
              defaultValue={v[k] ?? ""}
              className={campo}
              aria-invalid={Boolean(erros[k])}
            >
              <option value="">Escolha</option>
              {Object.entries(NOTAS)
                .reverse()
                .map(([n, t]) => (
                  <option key={n} value={n}>
                    {t}
                  </option>
                ))}
            </Selecao>
          </Campo>
        ))}
        <Campo
          id="observacao"
          rotulo="Observação (opcional)"
          erro={erros.observacao}
          className="sm:col-span-4"
        >
          <input
            id="observacao"
            name="observacao"
            maxLength={1000}
            defaultValue={v.observacao}
            className={campo}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar avaliação"}
        </button>
      </div>
    </form>
  );
}
