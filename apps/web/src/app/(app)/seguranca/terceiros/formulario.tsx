"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { formatarDocumento, type Terceiro } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarTerceiro } from "@/lib/acoes-terceiros";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeTerceiro({
  terceiro,
  embutido = false,
}: {
  terceiro?: Terceiro;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarTerceiro.bind(null, terceiro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    razaoSocial: terceiro?.razaoSocial ?? "",
    cnpj: terceiro ? formatarDocumento(terceiro.cnpj) : "",
    servico: terceiro?.servico ?? "",
    contato: terceiro?.contato ?? "",
    inicioContrato: terceiro?.inicioContrato ?? "",
    fimContrato: terceiro?.fimContrato ?? "",
  };
  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6`}
    >
      {terceiro && (
        <input type="hidden" name="versao" value={terceiro.versao} />
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="razaoSocial"
          rotulo="Razão social"
          erro={erros.razaoSocial}
          className="sm:col-span-2"
        >
          <input
            id="razaoSocial"
            name="razaoSocial"
            maxLength={150}
            defaultValue={v.razaoSocial}
            className={campo}
            aria-invalid={Boolean(erros.razaoSocial)}
          />
        </Campo>
        <Campo id="cnpj" rotulo="CNPJ" erro={erros.cnpj}>
          <input
            id="cnpj"
            name="cnpj"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            maxLength={18}
            defaultValue={v.cnpj}
            className={`${campo} font-mono`}
            aria-invalid={Boolean(erros.cnpj)}
          />
        </Campo>
        <Campo
          id="servico"
          rotulo="Serviço prestado"
          erro={erros.servico}
          className="sm:col-span-2"
        >
          <input
            id="servico"
            name="servico"
            maxLength={200}
            defaultValue={v.servico}
            className={campo}
            aria-invalid={Boolean(erros.servico)}
          />
        </Campo>
        <Campo id="contato" rotulo="Contato (opcional)" erro={erros.contato}>
          <input
            id="contato"
            name="contato"
            maxLength={120}
            defaultValue={v.contato}
            className={campo}
          />
        </Campo>
        <Campo
          id="inicioContrato"
          rotulo="Início do contrato"
          erro={erros.inicioContrato}
        >
          <input
            id="inicioContrato"
            name="inicioContrato"
            type="date"
            defaultValue={v.inicioContrato}
            className={campo}
            aria-invalid={Boolean(erros.inicioContrato)}
          />
        </Campo>
        <Campo
          id="fimContrato"
          rotulo="Fim do contrato (opcional)"
          erro={erros.fimContrato}
        >
          <input
            id="fimContrato"
            name="fimContrato"
            type="date"
            defaultValue={v.fimContrato}
            className={campo}
            aria-invalid={Boolean(erros.fimContrato)}
          />
        </Campo>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link href="/seguranca/terceiros" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : terceiro ? "Salvar" : "Cadastrar terceiro"}
        </button>
      </div>
    </form>
  );
}
