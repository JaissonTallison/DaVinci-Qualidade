"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AMBIENTES_ESOCIAL,
  ORGAOS_DE_CLASSE,
  PERGUNTAS_DO_EPI,
  type ConfiguracaoEsocial,
  type EventoSst,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  gerarEventoEsocial,
  marcarEventoEnviado,
  salvarConfiguracaoEsocial,
} from "@/lib/acoes-sst";
import {
  botaoLink,
  botaoSecundario,
  campo,
  campoCompacto,
  tituloDaSecao,
} from "@/lib/estilos";

export function ConfiguracaoDoEsocial({
  c,
}: {
  c: ConfiguracaoEsocial | null;
}) {
  return (
    <Formulario
      acao={salvarConfiguracaoEsocial}
      versao=""
      rotuloDoBotao="Salvar configuração"
    >
      {(erros, v) => {
        const d = (k: keyof ConfiguracaoEsocial) =>
          v[k] ??
          (c && c[k] !== null && c[k] !== undefined ? String(c[k]) : "");
        const t = (
          k: keyof ConfiguracaoEsocial,
          rotulo: string,
          extra: { tipo?: string; max?: number; ajuda?: string } = {},
        ) => (
          <Campo
            id={`es-${k}`}
            rotulo={rotulo}
            erro={erros[k]}
            ajuda={extra.ajuda}
          >
            <input
              id={`es-${k}`}
              name={k}
              type={extra.tipo ?? "text"}
              maxLength={extra.max}
              defaultValue={d(k)}
              className={campo}
            />
          </Campo>
        );
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {t("cnpj", "CNPJ do empregador", { max: 18 })}
              <Campo id="es-ambiente" rotulo="Ambiente" erro={erros.ambiente}>
                <Selecao
                  id="es-ambiente"
                  name="ambiente"
                  defaultValue={d("ambiente") || "2"}
                  className={campo}
                >
                  {Object.entries(AMBIENTES_ESOCIAL).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              {t("inicioSst", "Início do SST no eSocial", {
                tipo: "date",
                ajuda:
                  "Início da condição no S-2240 de quem foi admitido antes.",
              })}
            </div>
            <h3 className={tituloDaSecao}>
              Médico responsável pelo PCMSO (S-2220)
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {t("medicoNome", "Nome", { max: 70 })}
              {t("medicoCpf", "CPF (opcional)", { max: 14 })}
              {t("medicoCrm", "CRM", { max: 8 })}
              {t("medicoUf", "UF do CRM", { max: 2 })}
            </div>
            <h3 className={tituloDaSecao}>
              Responsável pelos registros ambientais (S-2240)
            </h3>
            <div className="grid gap-4 sm:grid-cols-5">
              {t("ambientalNome", "Nome", { max: 70 })}
              {t("ambientalCpf", "CPF", { max: 14 })}
              <Campo
                id="es-ambientalOrgao"
                rotulo="Conselho"
                erro={erros.ambientalOrgao}
              >
                <Selecao
                  id="es-ambientalOrgao"
                  name="ambientalOrgao"
                  defaultValue={d("ambientalOrgao") || "4"}
                  className={campo}
                >
                  {Object.entries(ORGAOS_DE_CLASSE).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              {t("ambientalNumero", "Número", { max: 14 })}
              {t("ambientalUf", "UF", { max: 2 })}
            </div>
            <fieldset>
              <legend className={tituloDaSecao}>
                Declaração sobre os EPIs (S-2240)
              </legend>
              <ul className="mt-2 flex flex-col gap-1.5 text-base">
                {(
                  Object.keys(
                    PERGUNTAS_DO_EPI,
                  ) as (keyof typeof PERGUNTAS_DO_EPI)[]
                ).map((k) => (
                  <li key={k}>
                    <label className="inline-flex items-start gap-2">
                      <input
                        type="checkbox"
                        name={`epi_${k}`}
                        value="S"
                        defaultChecked={(c?.epiDeclaracao[k] ?? "S") === "S"}
                        className="mt-1 size-4 accent-primaria"
                      />
                      {PERGUNTAS_DO_EPI[k]}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </>
        );
      }}
    </Formulario>
  );
}

export function GerarEvento({
  evento,
  referenciaId,
  rotulo,
}: {
  evento: EventoSst;
  referenciaId: string;
  rotulo: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pendente}
        className={`${botaoSecundario} h-8 text-sm`}
        onClick={() =>
          iniciar(async () =>
            setErro(await gerarEventoEsocial(evento, referenciaId)),
          )
        }
      >
        {pendente ? "Gerando…" : rotulo}
      </button>
      {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
    </span>
  );
}

export function MarcarEnviado({ id }: { id: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    marcarEventoEnviado.bind(null, id),
    {},
  );
  return (
    <details className="text-sm">
      <summary className={`cursor-pointer ${botaoLink} text-sm`}>
        Registrar recibo
      </summary>
      <form action={enviar} className="mt-2 flex flex-wrap items-center gap-2">
        <input
          name="recibo"
          placeholder="Número do recibo"
          aria-label="Número do recibo"
          maxLength={40}
          className={`${campoCompacto} w-56`}
        />
        <button
          type="submit"
          className={`${botaoSecundario} h-8 text-sm`}
          disabled={enviando}
        >
          Salvar
        </button>
        {estado.erro && <AvisoDeErro erro={estado.erro} />}
      </form>
    </details>
  );
}
