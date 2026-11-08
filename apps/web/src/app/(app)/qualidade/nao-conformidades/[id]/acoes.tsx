"use client";

import {
  CATEGORIAS_6M,
  METODOS_ANALISE,
  type NaoConformidade,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Recolhido } from "@/components/recolhido";
import { Selecao as SelecaoDeFormulario } from "@/components/selecao";
import {
  cancelarNc,
  enviarParaVerificacao,
  registrarTratamento,
  verificarEficacia,
} from "@/lib/acoes-nc";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";

/** A ação da etapa atual da NC, conforme o status (docs/05-modulos/nao-conformidades.md §1). O cancelamento fica à parte (secundário). */
export function AcaoDaEtapa({
  nc,
  causas,
}: {
  nc: NaoConformidade;
  /** Tipos de causa cadastrados (Cadastros › Listas de apoio). */
  causas: string[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {nc.status === "aberta" && (
        <FormularioTratamento nc={nc} causas={causas} />
      )}

      {nc.status === "em_tratamento" && (
        <>
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
          <Recolhido titulo="Revisar a análise e a ação corretiva">
            <FormularioTratamento nc={nc} causas={causas} />
          </Recolhido>
        </>
      )}

      {nc.status === "em_verificacao" && (
        <>
          {(nc.acaoCorretiva || nc.dataImplantacao) && (
            <div className="rounded-md border border-borda bg-superficie-2 p-3">
              <p className="text-sm font-semibold text-texto-2">
                O que verificar
              </p>
              {nc.acaoCorretiva && (
                <p className="mt-1 text-base whitespace-pre-line">
                  {nc.acaoCorretiva}
                </p>
              )}
              {nc.dataImplantacao && (
                <p className="mt-1 text-sm text-texto-2">
                  Ação implantada em {formatarData(nc.dataImplantacao)}.
                </p>
              )}
            </div>
          )}
          <Formulario
            acao={verificarEficacia.bind(null, nc.id)}
            versao={nc.versao}
            rotuloDoBotao="Registrar verificação"
          >
            {(erros, v) => (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-base font-medium text-texto">
                    Resultado da verificação
                  </legend>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <label className="flex flex-1 items-start gap-2 rounded-md border border-borda-campo p-3 has-[:checked]:border-acao has-[:checked]:bg-info-suave">
                      <input
                        type="radio"
                        name="eficaz"
                        value="sim"
                        defaultChecked={v.eficaz === "sim"}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-texto">Eficaz</span>
                        <span className="block text-sm text-texto-2">
                          A causa foi eliminada. A NC é encerrada.
                        </span>
                      </span>
                    </label>
                    <label className="flex flex-1 items-start gap-2 rounded-md border border-borda-campo p-3 has-[:checked]:border-acao has-[:checked]:bg-info-suave">
                      <input
                        type="radio"
                        name="eficaz"
                        value="nao"
                        defaultChecked={v.eficaz === "nao"}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-texto">Ineficaz</span>
                        <span className="block text-sm text-texto-2">
                          A causa não foi eliminada. Volta para tratamento e
                          conta um novo ciclo.
                        </span>
                      </span>
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
                  ajuda="Descreva a evidência que comprova o resultado (ex.: 30 dias de medições sem desvio). Fotos e documentos são anexados abaixo, em Evidências."
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
        </>
      )}
    </div>
  );
}

/** Cancelar a NC: ação administrativa, fica em posição secundária. */
export function CancelarNc({ nc }: { nc: NaoConformidade }) {
  return (
    <Recolhido titulo="Cancelar esta NC">
      <p className="text-base text-texto-2">
        Use só para NC aberta por engano ou em duplicidade. A NC não é apagada:
        fica cancelada, com o motivo e quem cancelou.
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
  );
}

function FormularioTratamento({
  nc,
  causas,
}: {
  nc: NaoConformidade;
  causas: string[];
}) {
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
          <Campo
            id="causaTipo"
            rotulo="Tipo de causa ou desvio"
            erro={erros.causaTipo}
          >
            {causas.length > 0 ? (
              <Selecao
                id="causaTipo"
                opcoes={Object.fromEntries(
                  [
                    ...causas,
                    ...(v.causaTipo && !causas.includes(v.causaTipo as string)
                      ? [v.causaTipo as string]
                      : nc.causaTipo && !causas.includes(nc.causaTipo)
                        ? [nc.causaTipo]
                        : []),
                  ].map((c) => [c, c]),
                )}
                valor={(v.causaTipo as string) ?? nc.causaTipo ?? ""}
                vazio="Não classificado"
              />
            ) : (
              <input
                id="causaTipo"
                name="causaTipo"
                defaultValue={(v.causaTipo as string) ?? nc.causaTipo ?? ""}
                maxLength={100}
                className={campo}
                placeholder="Cadastre em Cadastros › Listas de apoio"
              />
            )}
          </Campo>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-base font-medium text-texto">
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
