"use client";

import { useActionState } from "react";
import { DURACAO_MAXIMA_PT_HORAS, TIPOS_PT } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { solicitarPt } from "@/lib/acoes-pgr-pt";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export function FormularioDePt() {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    solicitarPt,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className="mt-6">
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Local", campo: "local" },
          { rotulo: "Início", campo: "inicio" },
          { rotulo: "Fim", campo: "fim" },
        ]}
        acoes={
          <>
            <Botao href="/seguranca/permissoes-de-trabalho" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Salvando…"
              variante="primario"
              tamanho="grande"
            >
              Solicitar PT
            </Botao>
          </>
        }
      >
        <Bloco
          id="trabalho"
          titulo="Trabalho"
          descricao="Tipo, local, serviço e quem executa."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-2">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo id="tipo" rotulo="Tipo de trabalho" erro={erros.tipo}>
              <Selecao
                id="tipo"
                required
                name="tipo"
                defaultValue={v.tipo ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.tipo)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_PT).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="local" rotulo="Local" erro={erros.local}>
              <input
                id="local"
                required
                name="local"
                maxLength={120}
                defaultValue={v.local}
                list="setores"
                className={campo}
                aria-invalid={Boolean(erros.local)}
              />
            </Campo>
            <Campo
              id="servico"
              rotulo="Serviço a executar"
              erro={erros.servico}
              className="sm:col-span-2"
            >
              <textarea
                id="servico"
                required
                name="servico"
                rows={2}
                maxLength={500}
                defaultValue={v.servico}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.servico)}
              />
            </Campo>
            <Campo
              id="executantes"
              rotulo="Executantes (nomes e empresa)"
              erro={erros.executantes}
              className="sm:col-span-2"
            >
              <input
                id="executantes"
                required
                name="executantes"
                maxLength={500}
                defaultValue={v.executantes}
                className={campo}
                aria-invalid={Boolean(erros.executantes)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="periodo"
          titulo="Período"
          descricao="Início e fim da permissão."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="inicio" rotulo="Início" erro={erros.inicio}>
              <input
                id="inicio"
                required
                name="inicio"
                type="datetime-local"
                defaultValue={v.inicio}
                className={campo}
                aria-invalid={Boolean(erros.inicio)}
              />
            </Campo>
            <Campo
              id="fim"
              rotulo="Fim"
              erro={erros.fim}
              ajuda={`No máximo ${DURACAO_MAXIMA_PT_HORAS} horas depois do início.`}
            >
              <input
                id="fim"
                required
                name="fim"
                type="datetime-local"
                defaultValue={v.fim}
                className={campo}
                aria-invalid={Boolean(erros.fim)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="riscos"
          titulo="Riscos e proteção"
          descricao="Riscos, medidas de controle e EPIs exigidos."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="riscos"
              rotulo="Riscos e medidas de controle"
              erro={erros.riscos}
              ajuda="Ex.: queda de altura: linha de vida, cinto paraquedista com duplo talabarte, área isolada."
              className="sm:col-span-2"
            >
              <textarea
                id="riscos"
                required
                name="riscos"
                rows={3}
                maxLength={1000}
                defaultValue={v.riscos}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.riscos)}
              />
            </Campo>
            <Campo
              id="epis"
              rotulo="EPIs exigidos (opcional)"
              erro={erros.epis}
              className="sm:col-span-2"
            >
              <input
                id="epis"
                name="epis"
                maxLength={500}
                defaultValue={v.epis}
                className={campo}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
