"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import type { Instrumento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { salvarInstrumento, type EstadoDaAcao } from "@/lib/acoes-calibracao";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const CAMPOS = [
  {
    nome: "descricao",
    rotulo: "Descrição",
    max: 150,
    colunas: "sm:col-span-2",
    ajuda: "Ex.: Paquímetro digital 150 mm",
  },
  { nome: "fabricante", rotulo: "Fabricante", max: 80 },
  { nome: "modelo", rotulo: "Modelo", max: 80 },
  { nome: "numeroSerie", rotulo: "Número de série", max: 60, mono: true },
  {
    nome: "faixa",
    rotulo: "Faixa de medição",
    max: 80,
    ajuda: "Ex.: 0 a 150 mm",
  },
  { nome: "local", rotulo: "Local", max: 120 },
  { nome: "responsavel", rotulo: "Responsável", max: 120 },
  {
    nome: "criterioAceitacao",
    rotulo: "Critério de aceitação",
    max: 200,
    colunas: "sm:col-span-2",
    ajuda:
      "Ex.: erro máximo ± 0,02 mm. É com ele que o certificado é aprovado ou reprovado.",
  },
] as const;

/** Cadastrar (sem `instrumento`) ou editar um instrumento. */
export function FormularioDeInstrumento({
  instrumento,
  embutido = false,
}: {
  instrumento?: Instrumento;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarInstrumento.bind(null, instrumento?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> =
    estado.valores ??
    Object.fromEntries(
      Object.entries(instrumento ?? {}).map(([k, x]) => [
        k,
        x === null || typeof x === "object" ? "" : String(x),
      ]),
    );
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6`}
    >
      {instrumento && (
        <input type="hidden" name="versao" value={instrumento.versao} />
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {erroGeral && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={erroGeral} />
          </div>
        )}
        <Campo
          id="tag"
          rotulo="TAG"
          erro={erros.tag}
          ajuda="Única na empresa. Ex.: PAQ-0042"
        >
          <input
            id="tag"
            name="tag"
            defaultValue={v.tag}
            maxLength={30}
            className={`${campo} font-mono uppercase`}
            aria-invalid={Boolean(erros.tag)}
          />
        </Campo>
        {CAMPOS.map((c) => (
          <Campo
            key={c.nome}
            id={c.nome}
            rotulo={c.rotulo}
            erro={erros[c.nome]}
            ajuda={"ajuda" in c ? c.ajuda : undefined}
            className={"colunas" in c ? c.colunas : ""}
          >
            <input
              id={c.nome}
              name={c.nome}
              defaultValue={v[c.nome]}
              maxLength={c.max}
              className={`${campo} ${"mono" in c ? "font-mono" : ""}`}
              aria-invalid={Boolean(erros[c.nome])}
            />
          </Campo>
        ))}
        <Campo
          id="frequenciaMeses"
          rotulo="Frequência de calibração (meses)"
          erro={erros.frequenciaMeses}
        >
          <input
            id="frequenciaMeses"
            name="frequenciaMeses"
            inputMode="numeric"
            defaultValue={v.frequenciaMeses ?? "12"}
            className={campo}
            aria-invalid={Boolean(erros.frequenciaMeses)}
          />
        </Campo>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link href="/qualidade/calibracao" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : instrumento
              ? "Salvar instrumento"
              : "Cadastrar instrumento"}
        </button>
      </div>
    </form>
  );
}
