"use client";

import {
  MEIOS_AFETADOS,
  SEVERIDADES_AMBIENTAIS,
  TIPOS_DE_OCORRENCIA,
  type OcorrenciaAmbiental,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  comunicarOcorrencia,
  criarOcorrencia,
  encerrarOcorrencia,
  ncDaOcorrencia,
} from "@/lib/acoes-ambiental-gestao";
import { areaDeTexto, campo } from "@/lib/estilos";

export function NovaOcorrencia({ hoje }: { hoje: string }) {
  return (
    <Formulario
      acao={criarOcorrencia}
      versao=""
      rotuloDoBotao="Registrar ocorrência"
    >
      {(erros, v) => (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
              <Selecao
                id="tipo"
                name="tipo"
                defaultValue={v.tipo ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_DE_OCORRENCIA).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="data" rotulo="Data" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                max={hoje}
                defaultValue={v.data ?? hoje}
                className={campo}
              />
            </Campo>
            <Campo id="hora" rotulo="Hora" erro={erros.hora}>
              <input
                id="hora"
                name="hora"
                type="time"
                defaultValue={v.hora}
                className={campo}
              />
            </Campo>
            <Campo id="severidade" rotulo="Severidade" erro={erros.severidade}>
              <Selecao
                id="severidade"
                name="severidade"
                defaultValue={v.severidade ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {Object.entries(SEVERIDADES_AMBIENTAIS).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="local"
              rotulo="Local"
              erro={erros.local}
              className="sm:col-span-2"
            >
              <input
                id="local"
                name="local"
                maxLength={150}
                defaultValue={v.local}
                className={campo}
              />
            </Campo>
            <Campo
              id="substancia"
              rotulo="O que vazou ou foi emitido"
              erro={erros.substancia}
            >
              <input
                id="substancia"
                name="substancia"
                maxLength={150}
                defaultValue={v.substancia}
                className={campo}
              />
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo
                id="quantidade"
                rotulo="Quantidade"
                erro={erros.quantidade}
              >
                <input
                  id="quantidade"
                  name="quantidade"
                  inputMode="decimal"
                  defaultValue={v.quantidade}
                  className={campo}
                />
              </Campo>
              <Campo id="unidade" rotulo="Unidade" erro={erros.unidade}>
                <input
                  id="unidade"
                  name="unidade"
                  maxLength={10}
                  defaultValue={v.unidade}
                  className={campo}
                />
              </Campo>
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-texto-2">
              O que foi atingido
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-5 text-base">
              {Object.entries(MEIOS_AFETADOS).map(([k, n]) => (
                <label key={k} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="meios"
                    value={k}
                    className="size-4 accent-primaria"
                  />
                  {n}
                </label>
              ))}
            </div>
            {erros.meios && (
              <p className="mt-1 text-sm text-nao-conforme">{erros.meios}</p>
            )}
            <p className="mt-1 text-sm text-texto-3">
              Severidade alta ou crítica, ou água atingida: a comunicação ao
              órgão ambiental é obrigatória em até 24 horas.
            </p>
          </fieldset>
          <Campo id="descricao" rotulo="O que aconteceu" erro={erros.descricao}>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              defaultValue={v.descricao}
              className={areaDeTexto}
            />
          </Campo>
          <Campo id="contencao" rotulo="Contenção feita" erro={erros.contencao}>
            <textarea
              id="contencao"
              name="contencao"
              rows={2}
              defaultValue={v.contencao}
              className={areaDeTexto}
            />
          </Campo>
        </>
      )}
    </Formulario>
  );
}

export function ComunicarOcorrencia({
  o,
  hoje,
}: {
  o: OcorrenciaAmbiental;
  hoje: string;
}) {
  return (
    <Bloco
      titulo="Comunicação ao órgão ambiental"
      descricao={
        o.comunicacaoObrigatoria
          ? "Obrigatória: até o dia seguinte à ocorrência."
          : "Registre se o órgão foi comunicado."
      }
    >
      <Formulario
        acao={comunicarOcorrencia.bind(null, o.id)}
        versao={o.versao}
        rotuloDoBotao="Registrar comunicação"
      >
        {(erros, v) => (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="orgao" rotulo="Órgão" erro={erros.orgao}>
              <input
                id="orgao"
                name="orgao"
                maxLength={120}
                defaultValue={v.orgao}
                className={campo}
              />
            </Campo>
            <Campo id="data" rotulo="Data" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                max={hoje}
                defaultValue={v.data ?? hoje}
                className={campo}
              />
            </Campo>
            <Campo
              id="protocolo"
              rotulo="Protocolo ou forma"
              erro={erros.protocolo}
            >
              <input
                id="protocolo"
                name="protocolo"
                maxLength={60}
                defaultValue={v.protocolo}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

export function NcDaOcorrencia({ o }: { o: OcorrenciaAmbiental }) {
  return (
    <Bloco
      titulo="Não conformidade"
      descricao="Abre a NC na Qualidade com o relato e a contenção, para tratar a causa."
    >
      <Formulario
        acao={ncDaOcorrencia.bind(null, o.id)}
        versao={o.versao}
        rotuloDoBotao="Abrir NC na Qualidade"
      >
        {(erros, v) => (
          <Campo
            id="responsavel"
            rotulo="Responsável pela NC"
            erro={erros.responsavel}
          >
            <input
              id="responsavel"
              name="responsavel"
              list="pessoas"
              maxLength={120}
              defaultValue={v.responsavel}
              className={`${campo} max-w-md`}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function EncerrarOcorrencia({ o }: { o: OcorrenciaAmbiental }) {
  return (
    <Bloco
      titulo="Encerrar"
      descricao="Causas, ações para não se repetir e, se houve, a remediação da área."
    >
      <Formulario
        acao={encerrarOcorrencia.bind(null, o.id)}
        versao={o.versao}
        rotuloDoBotao="Encerrar ocorrência"
      >
        {(erros, v) => (
          <>
            <Campo id="causas" rotulo="Causas" erro={erros.causas}>
              <textarea
                id="causas"
                name="causas"
                rows={2}
                defaultValue={v.causas}
                className={areaDeTexto}
              />
            </Campo>
            <Campo
              id="acoes"
              rotulo="Ações para não se repetir"
              erro={erros.acoes}
            >
              <textarea
                id="acoes"
                name="acoes"
                rows={2}
                defaultValue={v.acoes}
                className={areaDeTexto}
              />
            </Campo>
            <Campo
              id="remediacao"
              rotulo="Remediação (opcional)"
              erro={erros.remediacao}
            >
              <textarea
                id="remediacao"
                name="remediacao"
                rows={2}
                defaultValue={v.remediacao}
                className={areaDeTexto}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}
