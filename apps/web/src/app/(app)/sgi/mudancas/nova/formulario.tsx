"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import type { EstadoDaAcao } from "@/lib/acao";
import { proporMudanca } from "@/lib/acoes-sgi";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeMudanca() {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    proporMudanca,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-4xl`}>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="titulo"
          rotulo="Título"
          erro={erros.titulo}
          className="sm:col-span-3"
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
        <Campo
          id="descricao"
          rotulo="O que muda"
          erro={erros.descricao}
          className="sm:col-span-3"
        >
          <textarea
            id="descricao"
            name="descricao"
            rows={3}
            maxLength={1000}
            defaultValue={v.descricao}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.descricao)}
          />
        </Campo>
        <Campo
          id="motivo"
          rotulo="Motivo"
          erro={erros.motivo}
          className="sm:col-span-3"
        >
          <input
            id="motivo"
            name="motivo"
            maxLength={500}
            defaultValue={v.motivo}
            className={campo}
            aria-invalid={Boolean(erros.motivo)}
          />
        </Campo>
        <Campo
          id="impactos"
          rotulo="Impactos e riscos"
          erro={erros.impactos}
          ajuda="Pessoas, processos, recursos, SST e meio ambiente: o que precisa ser feito antes."
          className="sm:col-span-3"
        >
          <textarea
            id="impactos"
            name="impactos"
            rows={3}
            maxLength={1000}
            defaultValue={v.impactos}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.impactos)}
          />
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
        <Campo
          id="dataPrevista"
          rotulo="Data prevista"
          erro={erros.dataPrevista}
        >
          <input
            id="dataPrevista"
            name="dataPrevista"
            type="date"
            defaultValue={v.dataPrevista}
            className={campo}
            aria-invalid={Boolean(erros.dataPrevista)}
          />
        </Campo>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/sgi/mudancas" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Propor mudança"}
        </button>
      </div>
    </form>
  );
}
