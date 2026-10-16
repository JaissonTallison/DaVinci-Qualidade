"use client";

import { useActionState } from "react";
import {
  DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA,
  NORMAS,
  TIPOS_CONSTATACAO,
  type Auditoria,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  cancelarAuditoria,
  concluirAuditoria,
  formalizarNc,
  iniciarAuditoria,
  registrarConstatacao,
  type EstadoDaAcao,
} from "@/lib/acoes-auditorias";
import { hojeEmBrasilia } from "@/lib/datas";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  campoCompacto,
} from "@/lib/estilos";

export function IniciarAuditoria({ auditoria }: { auditoria: Auditoria }) {
  return (
    <Bloco
      titulo="Iniciar auditoria"
      descricao="No dia da auditoria, inicie-a para registrar as constatações."
    >
      <Formulario
        acao={iniciarAuditoria.bind(null, auditoria.id)}
        versao={auditoria.versao}
        rotuloDoBotao="Iniciar auditoria"
      >
        {() => null}
      </Formulario>
    </Bloco>
  );
}

export function RegistrarConstatacao({ auditoria }: { auditoria: Auditoria }) {
  return (
    <Bloco
      titulo="Registrar constatação"
      descricao="O que foi visto, contra qual requisito, e a evidência objetiva que sustenta a constatação."
    >
      <Formulario
        acao={registrarConstatacao.bind(null, auditoria.id)}
        versao={auditoria.versao}
        rotuloDoBotao="Registrar constatação"
      >
        {(erros, v) => (
          <>
            <div className="grid gap-5 sm:grid-cols-4">
              <Campo id="tipo" rotulo="Tipo" erro={erros["constatacao.tipo"]}>
                <Selecao
                  id="tipo"
                  name="tipo"
                  defaultValue={v.tipo ?? ""}
                  className={campo}
                  aria-invalid={Boolean(erros["constatacao.tipo"])}
                >
                  <option value="" disabled>
                    Escolha
                  </option>
                  {Object.entries(TIPOS_CONSTATACAO).map(([chave, nome]) => (
                    <option key={chave} value={chave}>
                      {nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo
                id="norma"
                rotulo="Norma"
                erro={erros["constatacao.norma"]}
              >
                <Selecao
                  id="norma"
                  name="norma"
                  defaultValue={v.norma ?? auditoria.normas[0]}
                  className={campo}
                  aria-invalid={Boolean(erros["constatacao.norma"])}
                >
                  {auditoria.normas.map((n) => (
                    <option key={n} value={n}>
                      {NORMAS[n]}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo
                id="clausula"
                rotulo="Cláusula"
                erro={erros["constatacao.clausula"]}
                ajuda="Ex.: 8.5.1"
              >
                <input
                  id="clausula"
                  name="clausula"
                  defaultValue={v.clausula}
                  maxLength={20}
                  className={`${campo} font-mono`}
                  aria-invalid={Boolean(erros["constatacao.clausula"])}
                />
              </Campo>
              <Campo id="area" rotulo="Área" erro={erros["constatacao.area"]}>
                <input
                  id="area"
                  name="area"
                  defaultValue={v.area}
                  maxLength={120}
                  className={campo}
                />
              </Campo>
            </div>
            <Campo
              id="descricao"
              rotulo="Constatação"
              erro={erros["constatacao.descricao"]}
            >
              <textarea
                id="descricao"
                name="descricao"
                rows={3}
                defaultValue={v.descricao}
                className={areaDeTexto}
                aria-invalid={Boolean(erros["constatacao.descricao"])}
              />
            </Campo>
            <Campo
              id="evidencia"
              rotulo="Evidência objetiva"
              erro={erros["constatacao.evidencia"]}
              ajuda="O registro, documento ou observação que comprova. Ex.: paquímetro PAQ-0042 com calibração vencida em uso."
            >
              <textarea
                id="evidencia"
                name="evidencia"
                rows={2}
                defaultValue={v.evidencia}
                className={areaDeTexto}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

/** Na linha da constatação de NC: responsável e prazo (padrão de 30 dias), e a NC nasce na Qualidade. */
export function FormalizarNc({
  auditoria,
  constatacaoId,
  voltar,
}: {
  auditoria: Auditoria;
  constatacaoId: string;
  /** Tela da jornada para onde voltar (padrão: o resumo). */
  voltar?: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    formalizarNc.bind(null, auditoria.id),
    {},
  );
  const prazoPadrao = new Date(`${hojeEmBrasilia()}T12:00:00Z`);
  prazoPadrao.setUTCDate(
    prazoPadrao.getUTCDate() + DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA,
  );
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <details className="relative inline-block text-left" open={Boolean(erro)}>
      <summary
        className={`${botaoSecundario} h-8 cursor-pointer list-none text-sm`}
      >
        Formalizar NC
      </summary>
      <form
        action={enviar}
        className="absolute right-0 z-10 mt-1 flex w-80 flex-col gap-3 rounded-md border border-borda bg-superficie p-4 shadow-sm"
      >
        <input type="hidden" name="versao" value={auditoria.versao} />
        <input type="hidden" name="constatacaoId" value={constatacaoId} />
        {voltar && <input type="hidden" name="voltar" value={voltar} />}
        <label className="flex flex-col gap-1 text-sm font-semibold text-texto-2">
          Responsável pela NC
          <input
            name="responsavel"
            list="pessoas"
            defaultValue={
              estado.valores?.responsavel ?? auditoria.representante ?? ""
            }
            maxLength={120}
            className={`${campoCompacto} w-full font-normal`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-texto-2">
          Prazo
          <input
            name="prazo"
            type="date"
            min={hojeEmBrasilia()}
            defaultValue={
              estado.valores?.prazo ?? prazoPadrao.toISOString().slice(0, 10)
            }
            className={`${campoCompacto} w-full font-normal`}
          />
        </label>
        {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? "Abrindo NC…" : "Abrir NC na Qualidade"}
        </button>
      </form>
    </details>
  );
}

export function ConcluirAuditoria({ auditoria }: { auditoria: Auditoria }) {
  const descricao =
    auditoria.ncsPendentes > 0
      ? `Antes de concluir, formalize ${auditoria.ncsPendentes === 1 ? "a NC pendente" : `as ${auditoria.ncsPendentes} NCs pendentes`}. Concluída, a auditoria não muda mais.`
      : "Escreva a conclusão: o sistema atende aos requisitos auditados? Concluída, a auditoria não muda mais.";
  return (
    <Bloco titulo="Concluir auditoria" descricao={descricao}>
      <Formulario
        acao={concluirAuditoria.bind(null, auditoria.id)}
        versao={auditoria.versao}
        rotuloDoBotao="Concluir auditoria"
      >
        {(erros, v) => (
          <Campo id="conclusao" rotulo="Conclusão" erro={erros.conclusao}>
            <textarea
              id="conclusao"
              name="conclusao"
              rows={4}
              defaultValue={v.conclusao}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.conclusao)}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function CancelarAuditoria({ auditoria }: { auditoria: Auditoria }) {
  return (
    <Recolhido titulo="Cancelar esta auditoria">
      <p className="text-base text-texto-2">
        A auditoria não é apagada: fica cancelada, com o motivo. As NCs já
        formalizadas continuam na Qualidade.
      </p>
      <Formulario
        acao={cancelarAuditoria.bind(null, auditoria.id)}
        versao={auditoria.versao}
        rotuloDoBotao={`Cancelar ${auditoria.numero}`}
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
