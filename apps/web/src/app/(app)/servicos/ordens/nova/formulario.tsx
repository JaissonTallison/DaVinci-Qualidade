"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import type { ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarOs } from "@/lib/acoes-servicos";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { EscolhaDeParceiro } from "../../escolha-de-parceiro";

export function FormularioDeOs({ clientes }: { clientes: ParceiroResumo[] }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarOs,
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
        <Campo id="prazo" rotulo="Prazo" erro={erros.prazo}>
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
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
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
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/servicos/ordens" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Abrir ordem de serviço"}
        </button>
      </div>
    </form>
  );
}
