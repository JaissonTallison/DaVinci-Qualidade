"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  MOTIVOS_ENTREGA,
  type Epi,
  type FuncionarioResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarEntrega } from "@/lib/acoes-epis";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** EPI com CA vencido aparece desabilitado: a pessoa vê que ele existe e por que não pode escolher. */
export function FormularioDeEntrega({
  funcionarios,
  epis,
  funcionarioId,
  voltar,
}: {
  funcionarios: FuncionarioResumo[];
  epis: Epi[];
  funcionarioId?: string;
  voltar: string;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarEntrega,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const hoje = hojeEmBrasilia();
  return (
    <form action={acao} noValidate className={`${painel} mt-6`}>
      <input type="hidden" name="voltar" value={voltar} />
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {erroGeral && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={erroGeral} />
          </div>
        )}
        <Campo
          id="funcionarioId"
          rotulo="Funcionário"
          erro={erros.funcionarioId}
          className="sm:col-span-3"
        >
          <Selecao
            id="funcionarioId"
            name="funcionarioId"
            defaultValue={v.funcionarioId ?? funcionarioId ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.funcionarioId)}
          >
            <option value="">Escolha</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.matricula} · {f.nome} · {f.funcaoNome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="epiId"
          rotulo="EPI"
          erro={erros.epiId}
          className="sm:col-span-2"
        >
          <Selecao
            id="epiId"
            name="epiId"
            defaultValue={v.epiId ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.epiId)}
          >
            <option value="">Escolha</option>
            {epis.map((e) => (
              <option key={e.id} value={e.id} disabled={e.caVencido}>
                {e.nome} · CA {e.ca}
                {e.caVencido
                  ? ` · CA vencido em ${formatarData(e.validadeCa)}`
                  : ""}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="quantidade" rotulo="Quantidade" erro={erros.quantidade}>
          <input
            id="quantidade"
            name="quantidade"
            inputMode="numeric"
            defaultValue={v.quantidade ?? "1"}
            className={campo}
            aria-invalid={Boolean(erros.quantidade)}
          />
        </Campo>
        <Campo id="data" rotulo="Data da entrega" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            max={hoje}
            defaultValue={v.data ?? hoje}
            className={campo}
            aria-invalid={Boolean(erros.data)}
          />
        </Campo>
        <Campo
          id="motivo"
          rotulo="Motivo"
          erro={erros.motivo}
          className="sm:col-span-2"
        >
          <Selecao
            id="motivo"
            name="motivo"
            defaultValue={v.motivo ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.motivo)}
          >
            <option value="">Escolha</option>
            {Object.entries(MOTIVOS_ENTREGA).map(([chave, nome]) => (
              <option key={chave} value={chave}>
                {nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <label className="flex items-center gap-2 text-base sm:col-span-3">
          <input
            type="checkbox"
            name="termoAssinado"
            value="sim"
            defaultChecked={v.termoAssinado === "sim"}
          />
          O funcionário assinou o termo de recebimento
        </label>
        <Campo
          id="observacao"
          rotulo="Observação (opcional)"
          erro={erros.observacao}
          className="sm:col-span-3"
        >
          <textarea
            id="observacao"
            name="observacao"
            rows={2}
            maxLength={500}
            defaultValue={v.observacao}
            className={areaDeTexto}
          />
        </Campo>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href={voltar} className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar entrega"}
        </button>
      </div>
    </form>
  );
}
