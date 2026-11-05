"use client";

import { useActionState } from "react";
import type { Contrato, ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarOs } from "@/lib/acoes-servicos";
import {
  areaDeTexto,
  botaoPrimario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Selecao } from "@/components/selecao";
import { EscolhaDeParceiro } from "../../escolha-de-parceiro";

export function FormularioDeOs({
  clientes,
  contratos,
}: {
  clientes: ParceiroResumo[];
  contratos: Contrato[];
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarOs,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className={`${painel} mt-6`}>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
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
        <Campo
          id="prazo"
          rotulo="Prazo"
          erro={erros.prazo}
          ajuda={
            contratos.length
              ? "Com contrato, em branco usa o prazo do SLA."
              : undefined
          }
        >
          <input
            id="prazo"
            name="prazo"
            type="date"
            defaultValue={v.prazo}
            className={campo}
            aria-invalid={Boolean(erros.prazo)}
          />
        </Campo>
        <Campo
          id="titulo"
          rotulo="Título"
          erro={erros.titulo}
          className="sm:col-span-2"
        >
          <input
            id="titulo"
            name="titulo"
            maxLength={150}
            defaultValue={v.titulo}
            className={campo}
            aria-invalid={Boolean(erros.titulo)}
          />
        </Campo>
        <Campo id="responsavel" rotulo="Responsável" erro={erros.responsavel}>
          <input
            id="responsavel"
            name="responsavel"
            list="pessoas"
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
        {contratos.length > 0 && (
          <Campo
            id="contratoId"
            rotulo="Contrato (SLA)"
            erro={erros.contratoId}
            className="sm:col-span-2"
          >
            <Selecao
              id="contratoId"
              name="contratoId"
              defaultValue={v.contratoId ?? ""}
              className={campo}
            >
              <option value="">Sem contrato</option>
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.numero} · {c.clienteNome} · SLA {c.prazoAtendimentoDias}{" "}
                  dia(s)
                </option>
              ))}
            </Selecao>
          </Campo>
        )}
        <Campo
          id="descricao"
          rotulo="O que será feito"
          erro={erros.descricao}
          className="sm:col-span-3"
        >
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            maxLength={2000}
            defaultValue={v.descricao}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.descricao)}
          />
        </Campo>
        <Campo
          id="checklist"
          rotulo="Checklist de execução (opcional)"
          erro={erros.checklist}
          ajuda="Um passo por linha. A conclusão da OS exige marcar todos."
          className="sm:col-span-3"
        >
          <textarea
            id="checklist"
            name="checklist"
            rows={5}
            defaultValue={v.checklist}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.checklist)}
          />
        </Campo>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Abrir ordem de serviço"}
        </button>
      </div>
    </form>
  );
}
