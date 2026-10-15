"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { TIPOS_MONITORAMENTO, type Monitoramento } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const num = (n: number | null | undefined) =>
  n === null || n === undefined
    ? ""
    : n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });

/** Cadastro e edição do ponto de monitoramento. Na edição vai dentro do bloco recolhido. */
export function FormularioDeMonitoramento({
  acao,
  monitoramento: m,
}: {
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>;
  monitoramento?: Monitoramento;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    tipo: m?.tipo ?? "",
    ponto: m?.ponto ?? "",
    parametro: m?.parametro ?? "",
    unidade: m?.unidade ?? "",
    limiteMinimo: num(m?.limiteMinimo),
    limiteMaximo: num(m?.limiteMaximo),
    referencia: m?.referencia ?? "",
    periodicidadeMeses: m ? String(m.periodicidadeMeses) : "",
  };
  const texto = (
    id: string,
    rotulo: string,
    max: number,
    ajuda?: string,
    largo = false,
  ) => (
    <Campo
      id={id}
      rotulo={rotulo}
      erro={erros[id]}
      ajuda={ajuda}
      className={largo ? "sm:col-span-2" : ""}
    >
      <input
        id={id}
        name={id}
        maxLength={max}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  const numero = (id: string, rotulo: string) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]}>
      <input
        id={id}
        name={id}
        inputMode="decimal"
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  return (
    <form
      action={enviar}
      noValidate
      className={m ? "" : `${painel} mt-6 max-w-4xl`}
    >
      {m && <input type="hidden" name="versao" value={m.versao} />}
      <div className={`grid gap-5 sm:grid-cols-3 ${m ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={v.tipo}
            className={campo}
            aria-invalid={Boolean(erros.tipo)}
          >
            <option value="">Escolha</option>
            {Object.entries(TIPOS_MONITORAMENTO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        {texto(
          "ponto",
          "Ponto de coleta",
          150,
          "Ex.: saída da ETE, chaminé da caldeira",
          true,
        )}
        {texto(
          "parametro",
          "Parâmetro",
          100,
          "Ex.: pH, DBO, material particulado",
        )}
        {texto("unidade", "Unidade", 20, "Ex.: mg/L, dB(A)")}
        <Campo
          id="periodicidadeMeses"
          rotulo="Coletar a cada (meses)"
          erro={erros.periodicidadeMeses}
        >
          <input
            id="periodicidadeMeses"
            name="periodicidadeMeses"
            type="number"
            min={1}
            max={60}
            defaultValue={v.periodicidadeMeses}
            className={campo}
            aria-invalid={Boolean(erros.periodicidadeMeses)}
          />
        </Campo>
        {numero("limiteMinimo", "Limite mínimo (opcional)")}
        {numero("limiteMaximo", "Limite máximo")}
        {texto(
          "referencia",
          "Legislação ou licença do limite (opcional)",
          200,
          "Ex.: CONAMA 430/2011 art. 16; LO 1234/2024",
          false,
        )}
      </div>
      <div
        className={`flex gap-3 ${m ? "mt-5" : "justify-end border-t border-borda px-5 py-3"}`}
      >
        {!m && (
          <Link href="/ambiental/monitoramentos" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : m
              ? "Salvar alterações"
              : "Cadastrar monitoramento"}
        </button>
      </div>
    </form>
  );
}
