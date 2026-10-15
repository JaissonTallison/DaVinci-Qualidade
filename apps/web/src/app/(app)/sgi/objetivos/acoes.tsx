"use client";

import { useActionState } from "react";
import { SENTIDOS_META, type Objetivo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  criarObjetivo,
  registrarMedicao,
  situacaoDoObjetivo,
} from "@/lib/acoes-sgi";
import { botaoPrimario, campo, campoCompacto } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function NovoObjetivo() {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarObjetivo,
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
          id="nome"
          rotulo="Objetivo"
          erro={erros.nome}
          className="sm:col-span-4"
          ajuda="Ex.: Reduzir o refugo da estamparia"
        >
          <input
            id="nome"
            name="nome"
            maxLength={200}
            defaultValue={v.nome}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo
          id="indicador"
          rotulo="Indicador"
          erro={erros.indicador}
          className="sm:col-span-2"
        >
          <input
            id="indicador"
            name="indicador"
            maxLength={150}
            defaultValue={v.indicador}
            className={campo}
            aria-invalid={Boolean(erros.indicador)}
          />
        </Campo>
        <Campo id="meta" rotulo="Meta" erro={erros.meta}>
          <input
            id="meta"
            name="meta"
            inputMode="decimal"
            defaultValue={v.meta}
            className={campo}
            aria-invalid={Boolean(erros.meta)}
          />
        </Campo>
        <Campo
          id="unidade"
          rotulo="Unidade"
          erro={erros.unidade}
          ajuda="Ex.: %, dias, peças"
        >
          <input
            id="unidade"
            name="unidade"
            maxLength={20}
            defaultValue={v.unidade}
            className={campo}
            aria-invalid={Boolean(erros.unidade)}
          />
        </Campo>
        <Campo
          id="sentido"
          rotulo="Sentido"
          erro={erros.sentido}
          className="sm:col-span-2"
        >
          <Selecao
            id="sentido"
            name="sentido"
            defaultValue={v.sentido ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.sentido)}
          >
            <option value="">Escolha</option>
            {Object.entries(SENTIDOS_META).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="responsavel"
          rotulo="Responsável"
          erro={erros.responsavel}
          className="sm:col-span-2"
        >
          <input
            id="responsavel"
            name="responsavel"
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Cadastrar objetivo"}
        </button>
      </div>
    </form>
  );
}

export function LancarMedicao({
  objetivo,
  mes,
}: {
  objetivo: Objetivo;
  mes: string;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarMedicao.bind(null, objetivo.id),
    {},
  );
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <form action={acao} noValidate className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="competencia"
          type="month"
          max={mes}
          defaultValue={estado.valores?.competencia ?? mes}
          aria-label="Mês"
          className={campoCompacto}
        />
        <input
          name="valor"
          inputMode="decimal"
          placeholder={`Valor (${objetivo.unidade})`}
          defaultValue={estado.valores?.valor}
          aria-label="Valor medido"
          className={`${campoCompacto} w-36`}
        />
        <input
          name="analise"
          placeholder="Análise (opcional)"
          maxLength={500}
          defaultValue={estado.valores?.analise}
          aria-label="Análise"
          className={`${campoCompacto} min-w-0 flex-1`}
        />
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          Lançar
        </button>
      </div>
      {erro && <p className="text-sm text-nao-conforme">{erro}</p>}
    </form>
  );
}

export function SituacaoDoObjetivo({ objetivo }: { objetivo: Objetivo }) {
  return (
    <Formulario
      acao={situacaoDoObjetivo.bind(null, objetivo.id)}
      versao={objetivo.versao}
      rotuloDoBotao={objetivo.ativo ? "Inativar objetivo" : "Reativar objetivo"}
      perigo={objetivo.ativo}
    >
      {() => (
        <input
          type="hidden"
          name="ativo"
          value={objetivo.ativo ? "nao" : "sim"}
        />
      )}
    </Formulario>
  );
}
