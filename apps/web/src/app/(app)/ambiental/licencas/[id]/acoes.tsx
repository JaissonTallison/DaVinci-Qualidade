"use client";

import { useActionState } from "react";
import type { Condicionante, Licenca } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  criarCondicionante,
  cumprirCondicionante,
  solicitarRenovacao,
} from "@/lib/acoes-ambiental";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoSecundario, campo, campoCompacto } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function SolicitarRenovacao({ licenca }: { licenca: Licenca }) {
  return (
    <Bloco
      titulo="Renovação protocolada"
      descricao="Registre o protocolo no órgão. O alerta de renovação sai do painel; a validade continua acompanhada."
    >
      <Formulario
        acao={solicitarRenovacao.bind(null, licenca.id)}
        versao={licenca.versao}
        rotuloDoBotao="Registrar protocolo"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-4">
            <Campo id="data" rotulo="Data do protocolo" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
              />
            </Campo>
            <Campo
              id="protocolo"
              rotulo="Número do protocolo"
              erro={erros.protocolo}
              className="sm:col-span-2"
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

/** A condicionante não tem versão própria: cada uma fica com o seu formulário curto. */
export function CumprirCondicionante({
  licencaId,
  condicionante,
}: {
  licencaId: string;
  condicionante: Condicionante;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    cumprirCondicionante.bind(null, licencaId, condicionante.id),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form
      action={enviar}
      noValidate
      className="mt-2 flex flex-wrap items-start gap-2"
    >
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div>
        <input
          name="data"
          type="date"
          aria-label="Data do cumprimento"
          defaultValue={v.data ?? hojeEmBrasilia()}
          className={campoCompacto}
        />
        {erros.data && (
          <p className="text-sm text-nao-conforme">{erros.data}</p>
        )}
      </div>
      <div className="min-w-60 flex-1">
        <input
          name="evidencia"
          maxLength={300}
          placeholder="Evidência (laudo, ofício, relatório)"
          aria-label="Evidência"
          defaultValue={v.evidencia}
          className={`${campoCompacto} w-full`}
        />
        {erros.evidencia && (
          <p className="text-sm text-nao-conforme">{erros.evidencia}</p>
        )}
      </div>
      <button type="submit" className={botaoSecundario} disabled={salvando}>
        {salvando ? "Salvando…" : "Marcar cumprida"}
      </button>
    </form>
  );
}

export function NovaCondicionante({ licencaId }: { licencaId: string }) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarCondicionante.bind(null, licencaId),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <Recolhido titulo="Adicionar condicionante">
      <form action={enviar} noValidate className="flex flex-col gap-5">
        {estado.erro && !estado.erro.detalhes?.length && (
          <AvisoDeErro erro={estado.erro} />
        )}
        <div className="grid gap-5 sm:grid-cols-4">
          <Campo
            id="descricao"
            rotulo="Condicionante"
            erro={erros.descricao}
            className="sm:col-span-4"
          >
            <input
              id="descricao"
              name="descricao"
              maxLength={500}
              defaultValue={v.descricao}
              className={campo}
            />
          </Campo>
          <Campo id="prazo" rotulo="Prazo (opcional)" erro={erros.prazo}>
            <input
              id="prazo"
              name="prazo"
              type="date"
              defaultValue={v.prazo}
              className={campo}
            />
          </Campo>
          <Campo
            id="periodicidadeMeses"
            rotulo="Repete a cada (meses)"
            erro={erros.periodicidadeMeses}
            ajuda="Vazio: cumpre uma vez."
          >
            <input
              id="periodicidadeMeses"
              name="periodicidadeMeses"
              type="number"
              min={1}
              max={60}
              defaultValue={v.periodicidadeMeses}
              className={campo}
            />
          </Campo>
        </div>
        <div>
          <button type="submit" className={botaoSecundario} disabled={salvando}>
            {salvando ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      </form>
    </Recolhido>
  );
}
