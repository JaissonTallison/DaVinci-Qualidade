"use client";

import { useActionState } from "react";
import type { ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarNps } from "@/lib/acoes-servicos";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoPrimario, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { EscolhaDeParceiro } from "../escolha-de-parceiro";

export function FormularioDeNps({ clientes }: { clientes: ParceiroResumo[] }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarNps,
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
          id="clienteId"
          rotulo="Cliente"
          erro={erros.clienteId}
          className="sm:col-span-2"
        >
          <EscolhaDeParceiro
            id="clienteId"
            parceiros={clientes}
            valor={v.clienteId}
            invalido={Boolean(erros.clienteId)}
          />
        </Campo>
        <Campo id="data" rotulo="Data da resposta" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            max={hojeEmBrasilia()}
            defaultValue={v.data ?? hojeEmBrasilia()}
            className={campo}
          />
        </Campo>
        <Campo id="nota" rotulo="Nota (0 a 10)" erro={erros.nota}>
          <Selecao
            id="nota"
            name="nota"
            defaultValue={v.nota ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.nota)}
          >
            <option value="">Escolha</option>
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="comentario"
          rotulo="Comentário do cliente (opcional)"
          erro={erros.comentario}
          className="sm:col-span-4"
        >
          <input
            id="comentario"
            name="comentario"
            maxLength={1000}
            defaultValue={v.comentario}
            className={campo}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar resposta"}
        </button>
      </div>
    </form>
  );
}
