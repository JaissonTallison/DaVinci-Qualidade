"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TIPOS_INOVACAO } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { proporMudanca } from "@/lib/acoes-sgi";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeInovacao() {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    proporMudanca,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className="mt-6">
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Tipo", campo: "tipoInovacao" },
          { rotulo: "Responsável", campo: "responsavel" },
          { rotulo: "Previsão", campo: "dataPrevista" },
        ]}
        acoes={
          <>
            <Link href="/sgi/inovacao" className={botaoSecundario}>
              Cancelar
            </Link>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando ? "Salvando…" : "Propor inovação"}
            </button>
          </>
        }
      >
        <Bloco
          id="proposta"
          titulo="Proposta"
          descricao="Título, tipo e o que se propõe."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo
              id="titulo"
              rotulo="Título"
              erro={erros.titulo}
              className="sm:col-span-2"
            >
              <input
                id="titulo"
                required
                name="titulo"
                maxLength={150}
                defaultValue={v.titulo}
                className={campo}
                aria-invalid={Boolean(erros.titulo)}
              />
            </Campo>
            <Campo
              id="tipoInovacao"
              rotulo="Tipo de inovação"
              erro={erros.tipoInovacao}
            >
              <Selecao
                id="tipoInovacao"
                required
                name="tipoInovacao"
                defaultValue={v.tipoInovacao}
                className={campo}
                aria-invalid={Boolean(erros.tipoInovacao)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_INOVACAO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="descricao"
              rotulo="A proposta de inovação"
              erro={erros.descricao}
              className="sm:col-span-3"
            >
              <textarea
                id="descricao"
                required
                name="descricao"
                rows={3}
                maxLength={1000}
                defaultValue={v.descricao}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.descricao)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="justificativa"
          titulo="Justificativa"
          descricao="Motivação, ganho esperado e recursos necessários."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="motivo"
              rotulo="Oportunidade ou motivação"
              erro={erros.motivo}
              className="sm:col-span-3"
            >
              <input
                id="motivo"
                required
                name="motivo"
                maxLength={500}
                defaultValue={v.motivo}
                className={campo}
                aria-invalid={Boolean(erros.motivo)}
              />
            </Campo>
            <Campo
              id="ganhoEsperado"
              rotulo="Ganho esperado"
              erro={erros.ganhoEsperado}
              ajuda="Benefício: produtividade, custo, qualidade, satisfação, impacto ambiental…"
              className="sm:col-span-3"
            >
              <textarea
                id="ganhoEsperado"
                required
                name="ganhoEsperado"
                rows={2}
                maxLength={500}
                defaultValue={v.ganhoEsperado}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.ganhoEsperado)}
              />
            </Campo>
            <Campo
              id="impactos"
              rotulo="Impactos e recursos necessários"
              erro={erros.impactos}
              ajuda="Pessoas, processos, recursos, SST e meio ambiente: o que precisa ser feito antes."
              className="sm:col-span-3"
            >
              <textarea
                id="impactos"
                required
                name="impactos"
                rows={3}
                maxLength={1000}
                defaultValue={v.impactos}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.impactos)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="responsavel"
          titulo="Responsável e prazo"
          descricao="Quem conduz e quando deve ser implementada."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="responsavel"
              rotulo="Responsável"
              erro={erros.responsavel}
              className="sm:col-span-2"
            >
              <input
                id="responsavel"
                required
                name="responsavel"
                list="pessoas"
                maxLength={120}
                defaultValue={v.responsavel}
                className={campo}
                aria-invalid={Boolean(erros.responsavel)}
              />
            </Campo>
            <Campo
              id="dataPrevista"
              rotulo="Previsão de implementação"
              erro={erros.dataPrevista}
            >
              <input
                id="dataPrevista"
                required
                name="dataPrevista"
                type="date"
                defaultValue={v.dataPrevista}
                className={campo}
                aria-invalid={Boolean(erros.dataPrevista)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
