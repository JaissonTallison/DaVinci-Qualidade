"use client";

import {
  CATEGORIAS_6M,
  METODOS_ANALISE,
  type NaoConformidade,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao as SelecaoDeFormulario } from "@/components/selecao";
import {
  cancelarNc,
  enviarParaVerificacao,
  registrarTratamento,
  verificarEficacia,
} from "@/lib/acoes-nc";
import { hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";

/** O próximo passo da NC, conforme o status (docs/05-modulos/nao-conformidades.md §1). */
export function AcoesDaNc({
  nc,
  podeCancelar,
}: {
  nc: NaoConformidade;
  podeCancelar: boolean;
}) {
  return (
    <>
      {nc.status === "aberta" && (
        <Bloco
          titulo="Registrar tratamento"
          descricao="Analise a causa raiz e defina a ação corretiva. A NC passa para “Em tratamento”."
        >
          <FormularioTratamento nc={nc} />
        </Bloco>
      )}

      {nc.status === "em_tratamento" && (
        <>
          <Bloco
            titulo="Enviar para verificação"
            descricao="Depois de implantar a ação corretiva, informe a data. A eficácia é verificada em seguida."
          >
            <Formulario
              acao={enviarParaVerificacao.bind(null, nc.id)}
              versao={nc.versao}
              rotuloDoBotao="Enviar para verificação"
            >
              {(erros, v) => (
                <Campo
                  id="dataImplantacao"
                  rotulo="Implantada em"
                  erro={erros.dataImplantacao}
                  className="sm:w-56"
                >
                  <input
                    id="dataImplantacao"
                    name="dataImplantacao"
                    type="date"
                    min={nc.dataAbertura}
                    max={hojeEmBrasilia()}
                    defaultValue={v.dataImplantacao}
                    className={campo}
                    aria-invalid={Boolean(erros.dataImplantacao)}
                  />
                </Campo>
              )}
            </Formulario>
          </Bloco>
          <Recolhido titulo="Revisar a análise e a ação corretiva">
            <FormularioTratamento nc={nc} />
          </Recolhido>
        </>
      )}

      {nc.status === "em_verificacao" && (
        <Bloco
          titulo="Verificar eficácia"
          descricao="A ação eliminou a causa? Eficaz encerra a NC. Ineficaz devolve para tratamento e conta um novo ciclo."
        >
          <Formulario
            acao={verificarEficacia.bind(null, nc.id)}
            versao={nc.versao}
            rotuloDoBotao="Registrar verificação"
          >
            {(erros, v) => (
              <>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-semibold text-texto-2">
                    Resultado
                  </legend>
                  <div className="flex gap-6 text-base">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eficaz"
                        value="sim"
                        defaultChecked={v.eficaz === "sim"}
                      />{" "}
                      Eficaz
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="eficaz"
                        value="nao"
                        defaultChecked={v.eficaz === "nao"}
                      />{" "}
                      Ineficaz
                    </label>
                  </div>
                  {erros.eficaz && (
                    <p className="text-sm text-nao-conforme">{erros.eficaz}</p>
                  )}
                </fieldset>
                <Campo
                  id="parecer"
                  rotulo="Parecer"
                  erro={erros.parecer}
                  ajuda="Que evidência mostra o resultado? Ex.: 30 dias de medições sem desvio."
                >
                  <textarea
                    id="parecer"
                    name="parecer"
                    rows={3}
                    defaultValue={v.parecer}
                    className={areaDeTexto}
                    aria-invalid={Boolean(erros.parecer)}
                  />
                </Campo>
              </>
            )}
          </Formulario>
        </Bloco>
      )}

      {podeCancelar && (
        <Recolhido titulo="Cancelar esta NC">
          <p className="text-base text-texto-2">
            Use só para NC aberta por engano ou em duplicidade. A NC não é
            apagada: fica cancelada, com o motivo e quem cancelou.
          </p>
          <Formulario
            acao={cancelarNc.bind(null, nc.id)}
            versao={nc.versao}
            rotuloDoBotao={`Cancelar ${nc.numero}`}
            perigo
          >
            {(erros, v) => (
              <Campo
                id="motivo"
                rotulo="Motivo do cancelamento"
                erro={erros.motivo}
              >
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={2}
                  defaultValue={v.motivo}
                  className={areaDeTexto}
                  aria-invalid={Boolean(erros.motivo)}
                />
              </Campo>
            )}
          </Formulario>
        </Recolhido>
      )}
    </>
  );
}

function FormularioTratamento({ nc }: { nc: NaoConformidade }) {
  return (
    <Formulario
      acao={registrarTratamento.bind(null, nc.id)}
      versao={nc.versao}
      rotuloDoBotao={
        nc.status === "aberta" ? "Registrar tratamento" : "Salvar revisão"
      }
    >
      {(erros, v) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="metodoAnalise"
              rotulo="Método de análise"
              erro={erros.metodoAnalise}
            >
              <Selecao
                id="metodoAnalise"
                opcoes={METODOS_ANALISE}
                valor={v.metodoAnalise ?? nc.metodoAnalise ?? "cinco_porques"}
              />
            </Campo>
            <Campo
              id="categoria6m"
              rotulo="Categoria 6M"
              erro={erros.categoria6m}
            >
              <Selecao
                id="categoria6m"
                opcoes={CATEGORIAS_6M}
                valor={v.categoria6m ?? nc.categoria6m ?? ""}
                vazio="Não classificada"
              />
            </Campo>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-texto-2">
              Porquês (até 5)
            </legend>
            {[0, 1, 2, 3, 4].map((i) => (
              <input
                key={i}
                name="porques"
                aria-label={`${i + 1}º porquê`}
                placeholder={`${i + 1}º porquê`}
                defaultValue={nc.porques[i]}
                maxLength={300}
                className={campo}
              />
            ))}
          </fieldset>
          <Campo id="causaRaiz" rotulo="Causa raiz" erro={erros.causaRaiz}>
            <textarea
              id="causaRaiz"
              name="causaRaiz"
              rows={3}
              defaultValue={v.causaRaiz ?? nc.causaRaiz ?? ""}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.causaRaiz)}
            />
          </Campo>
          <Campo
            id="acaoCorretiva"
            rotulo="Ação corretiva"
            erro={erros.acaoCorretiva}
            ajuda="O que vai eliminar a causa, não só o efeito."
          >
            <textarea
              id="acaoCorretiva"
              name="acaoCorretiva"
              rows={3}
              defaultValue={v.acaoCorretiva ?? nc.acaoCorretiva ?? ""}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.acaoCorretiva)}
            />
          </Campo>
        </>
      )}
    </Formulario>
  );
}

function Selecao({
  id,
  opcoes,
  valor,
  vazio,
}: {
  id: string;
  opcoes: Record<string, string>;
  valor: string;
  vazio?: string;
}) {
  return (
    <SelecaoDeFormulario
      id={id}
      name={id}
      defaultValue={valor}
      className={campo}
    >
      {vazio && <option value="">{vazio}</option>}
      {Object.entries(opcoes).map(([chave, nome]) => (
        <option key={chave} value={chave}>
          {nome}
        </option>
      ))}
    </SelecaoDeFormulario>
  );
}
