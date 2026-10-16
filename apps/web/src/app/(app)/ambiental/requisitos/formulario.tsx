"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { ESFERAS, type RequisitoLegal } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cadastro e edição do requisito legal. Na edição vai dentro do bloco recolhido, sem moldura própria. */
export function FormularioDeRequisito({
  acao,
  requisito,
}: {
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>;
  requisito?: RequisitoLegal;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    norma: requisito?.norma ?? "",
    esfera: requisito?.esfera ?? "",
    tema: requisito?.tema ?? "",
    requisito: requisito?.requisito ?? "",
  };
  return (
    <form
      action={enviar}
      noValidate
      className={requisito ? "" : `${painel} mt-6`}
    >
      {requisito && (
        <input type="hidden" name="versao" value={requisito.versao} />
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${requisito ? "" : "p-5"}`}>
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="norma"
          rotulo="Legislação ou norma"
          erro={erros.norma}
          className="sm:col-span-2"
          ajuda="Ex.: Resolução CONAMA 430/2011, art. 16"
        >
          <input
            id="norma"
            name="norma"
            maxLength={200}
            defaultValue={v.norma}
            className={campo}
            aria-invalid={Boolean(erros.norma)}
          />
        </Campo>
        <Campo id="esfera" rotulo="Esfera" erro={erros.esfera}>
          <Selecao
            id="esfera"
            name="esfera"
            defaultValue={v.esfera}
            className={campo}
            aria-invalid={Boolean(erros.esfera)}
          >
            <option value="">Escolha</option>
            {Object.entries(ESFERAS).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo
          id="tema"
          rotulo="Tema"
          erro={erros.tema}
          ajuda="Ex.: efluentes, resíduos, emissões, água"
        >
          <input
            id="tema"
            name="tema"
            maxLength={100}
            defaultValue={v.tema}
            className={campo}
            aria-invalid={Boolean(erros.tema)}
          />
        </Campo>
        <Campo
          id="requisito"
          rotulo="O que exige da empresa"
          erro={erros.requisito}
          className="sm:col-span-3"
        >
          <textarea
            id="requisito"
            name="requisito"
            rows={4}
            maxLength={1000}
            defaultValue={v.requisito}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.requisito)}
          />
        </Campo>
      </div>
      <div
        className={`flex gap-3 ${requisito ? "mt-5" : "justify-end border-t border-borda px-5 py-3"}`}
      >
        {!requisito && (
          <Link href="/ambiental/requisitos" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : requisito
              ? "Salvar alterações"
              : "Cadastrar requisito"}
        </button>
      </div>
    </form>
  );
}
