"use client";

import { useActionState, useState } from "react";
import type { EstadoDaAcao } from "@/lib/acao";
import { responderPesquisa } from "@/lib/acoes-servicos";
import { areaDeTexto, botaoPrimario } from "@/lib/estilos";

/** Nota de 0 a 10 (recomendação) e, quando há OS, a nota do serviço de 1 a 5. */
export function FormularioDaPesquisa({
  token,
  comOs,
}: {
  token: string;
  comOs: boolean;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    responderPesquisa.bind(null, token),
    {},
  );
  const [nota, setNota] = useState(estado.valores?.nota ?? "");
  const [notaOs, setNotaOs] = useState(estado.valores?.notaOs ?? "");
  const escala = (
    de: number,
    ate: number,
    valor: string,
    mudar: (v: string) => void,
    nome: string,
    rotulo: string,
  ) => (
    <fieldset className="mt-6">
      <legend className="text-base font-semibold">{rotulo}</legend>
      <input type="hidden" name={nome} value={valor} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Array.from({ length: ate - de + 1 }, (_, i) => String(de + i)).map(
          (n) => (
            <button
              key={n}
              type="button"
              aria-pressed={valor === n}
              onClick={() => mudar(n)}
              className={`size-10 rounded-sm border text-base tabular-nums ${valor === n ? "border-primaria bg-primaria text-primaria-texto" : "border-borda-forte bg-superficie hover:bg-superficie-2"}`}
            >
              {n}
            </button>
          ),
        )}
      </div>
    </fieldset>
  );
  return (
    <form action={enviar} className="mt-2">
      {escala(
        0,
        10,
        nota,
        setNota,
        "nota",
        "De 0 a 10, quanto você recomendaria nossos serviços a um colega?",
      )}
      <p className="mt-1 flex justify-between text-xs text-texto-3">
        <span>0 · nada provável</span>
        <span>10 · com certeza</span>
      </p>
      {comOs &&
        escala(
          1,
          5,
          notaOs,
          setNotaOs,
          "notaOs",
          "De 1 a 5, como foi este serviço?",
        )}
      <label className="mt-6 flex flex-col gap-1.5">
        <span className="text-base font-semibold">
          Quer comentar? (opcional)
        </span>
        <textarea
          name="comentario"
          rows={3}
          maxLength={1000}
          defaultValue={estado.valores?.comentario}
          className={areaDeTexto}
        />
      </label>
      {estado.erro && (
        <p className="mt-3 text-sm text-nao-conforme">{estado.erro.mensagem}</p>
      )}
      <button
        type="submit"
        className={`${botaoPrimario} mt-5`}
        disabled={enviando || nota === ""}
      >
        {enviando ? "Enviando…" : "Enviar resposta"}
      </button>
    </form>
  );
}
