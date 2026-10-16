"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { formatarDocumento, type Parceiro } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarParceiro } from "@/lib/acoes-parceiros";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cadastro enxuto: identificação, papéis e contato. Endereço e dados fiscais ficam para quando o sistema precisar. */
export function FormularioDeParceiro({
  parceiro,
  embutido = false,
}: {
  parceiro?: Parceiro;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarParceiro.bind(null, parceiro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    tipoPessoa: parceiro?.tipoPessoa ?? "PJ",
    documento: parceiro ? formatarDocumento(parceiro.documento) : "",
    nome: parceiro?.nome ?? "",
    nomeFantasia: parceiro?.nomeFantasia ?? "",
    papeis: (parceiro?.papeis ?? []).join(","),
    email: parceiro?.email ?? "",
    telefone: parceiro?.telefone ?? "",
    observacoes: parceiro?.observacoes ?? "",
  };
  const papeis = new Set(v.papeis?.split(",") ?? []);
  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6`}
    >
      {parceiro && (
        <input type="hidden" name="versao" value={parceiro.versao} />
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo id="tipoPessoa" rotulo="Tipo" erro={erros.tipoPessoa}>
          <Selecao
            id="tipoPessoa"
            name="tipoPessoa"
            defaultValue={v.tipoPessoa}
            className={campo}
          >
            <option value="PJ">Empresa (CNPJ)</option>
            <option value="PF">Pessoa física (CPF)</option>
          </Selecao>
        </Campo>
        <Campo id="documento" rotulo="CNPJ ou CPF" erro={erros.documento}>
          <input
            id="documento"
            name="documento"
            inputMode="numeric"
            maxLength={18}
            defaultValue={v.documento}
            className={`${campo} font-mono`}
            aria-invalid={Boolean(erros.documento)}
          />
        </Campo>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-texto-2">Papel</legend>
          <div className="flex h-9 items-center gap-5 text-base">
            {[
              ["cliente", "Cliente"],
              ["fornecedor", "Fornecedor"],
            ].map(([k, n]) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  key={`${k}-${papeis.has(k!)}`}
                  type="checkbox"
                  name="papeis"
                  value={k}
                  defaultChecked={papeis.has(k!)}
                />{" "}
                {n}
              </label>
            ))}
          </div>
          {erros.papeis && (
            <p className="text-sm text-nao-conforme">{erros.papeis}</p>
          )}
        </fieldset>
        <Campo
          id="nome"
          rotulo="Razão social ou nome"
          erro={erros.nome}
          className="sm:col-span-2"
        >
          <input
            id="nome"
            name="nome"
            maxLength={150}
            defaultValue={v.nome}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo
          id="nomeFantasia"
          rotulo="Nome fantasia (opcional)"
          erro={erros.nomeFantasia}
        >
          <input
            id="nomeFantasia"
            name="nomeFantasia"
            maxLength={150}
            defaultValue={v.nomeFantasia}
            className={campo}
          />
        </Campo>
        <Campo id="email" rotulo="E-mail (opcional)" erro={erros.email}>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={150}
            defaultValue={v.email}
            className={campo}
            aria-invalid={Boolean(erros.email)}
          />
        </Campo>
        <Campo id="telefone" rotulo="Telefone (opcional)" erro={erros.telefone}>
          <input
            id="telefone"
            name="telefone"
            inputMode="tel"
            maxLength={20}
            defaultValue={v.telefone}
            className={campo}
            aria-invalid={Boolean(erros.telefone)}
          />
        </Campo>
        <Campo
          id="observacoes"
          rotulo="Observações (opcional)"
          erro={erros.observacoes}
          className="sm:col-span-3"
        >
          <textarea
            id="observacoes"
            name="observacoes"
            rows={2}
            maxLength={2000}
            defaultValue={v.observacoes}
            className={areaDeTexto}
          />
        </Campo>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link
            href="/cadastros/clientes-e-fornecedores"
            className={botaoSecundario}
          >
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : parceiro ? "Salvar" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
