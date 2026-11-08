"use client";

import { useActionState } from "react";
import { ENTRADAS_ANALISE_CRITICA } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarAnaliseCritica } from "@/lib/acoes-sgi";
import { hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

/** As entradas da 9.3.2 já vêm como roteiro: é só escrever embaixo de cada uma. */
const ROTEIRO = ENTRADAS_ANALISE_CRITICA.map((e) => `${e}:\n`).join("\n");

export function FormularioDeAnalise() {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarAnaliseCritica,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className="mt-6">
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Data", campo: "data" },
          { rotulo: "Próxima análise", campo: "proximaAnalise" },
        ]}
        acoes={
          <>
            <Botao href="/sgi/analises-criticas" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Salvando…"
              variante="primario"
              tamanho="grande"
            >
              Registrar análise crítica
            </Botao>
          </>
        }
      >
        <Bloco id="reuniao" titulo="Reunião" descricao="Data e participantes.">
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo id="data" rotulo="Data da reunião" erro={erros.data}>
              <input
                id="data"
                required
                name="data"
                type="date"
                max={hojeEmBrasilia()}
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
                aria-invalid={Boolean(erros.data)}
              />
            </Campo>
            <Campo
              id="participantes"
              rotulo="Participantes"
              erro={erros.participantes}
              className="sm:col-span-2"
            >
              <input
                id="participantes"
                required
                name="participantes"
                maxLength={500}
                defaultValue={v.participantes}
                className={campo}
                aria-invalid={Boolean(erros.participantes)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="conteudo"
          titulo="Entradas e saídas"
          descricao="O que foi analisado e o que foi decidido (ISO 9001, 9.3)."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="entradas"
              rotulo="Entradas analisadas (ISO 9001, 9.3.2)"
              erro={erros.entradas}
              className="sm:col-span-3"
            >
              <textarea
                id="entradas"
                required
                name="entradas"
                rows={16}
                maxLength={6000}
                defaultValue={v.entradas ?? ROTEIRO}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.entradas)}
              />
            </Campo>
            <Campo
              id="decisoes"
              rotulo="Decisões e ações (saídas, 9.3.3)"
              erro={erros.decisoes}
              className="sm:col-span-3"
            >
              <textarea
                id="decisoes"
                required
                name="decisoes"
                rows={5}
                maxLength={4000}
                defaultValue={v.decisoes}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.decisoes)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="proxima"
          titulo="Próxima análise"
          descricao="Quando a direção volta a analisar o sistema."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="proximaAnalise"
              rotulo="Próxima análise"
              erro={erros.proximaAnalise}
            >
              <input
                id="proximaAnalise"
                required
                name="proximaAnalise"
                type="date"
                defaultValue={v.proximaAnalise}
                className={campo}
                aria-invalid={Boolean(erros.proximaAnalise)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
