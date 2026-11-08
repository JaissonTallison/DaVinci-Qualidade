"use client";

import {
  CONCLUSOES_DA_ANALISE,
  SITUACOES_DO_REQUISITO_DO_CONTRATO,
  TIPOS_DE_REQUISITO_DO_CONTRATO,
  type Contrato,
  type RequisitoDoContrato,
  type SituacaoDoRequisitoDoContrato,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Recolhido } from "@/components/recolhido";
import { Selecao } from "@/components/selecao";
import {
  analisarContrato,
  atualizarRequisito,
  criarRequisito,
  removerRequisito,
  situacaoRequisito,
} from "@/lib/acoes-servicos";
import { areaDeTexto, campo } from "@/lib/estilos";

const COR_DA_SITUACAO: Record<SituacaoDoRequisitoDoContrato, string> = {
  atendido: "text-conforme",
  pendente: "text-atencao",
  nao_se_aplica: "text-texto-3",
};

/** Campos do requisito, reaproveitados no cadastro e na edição. */
function CamposDoRequisito({
  erros,
  v,
  r,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  r?: RequisitoDoContrato;
}) {
  const d = (k: keyof RequisitoDoContrato, fallback = "") =>
    v[k] ?? (r?.[k] === null || r?.[k] === undefined ? fallback : String(r[k]));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={d("tipo")}
            className={campo}
            aria-invalid={Boolean(erros.tipo)}
          >
            <option value="">Escolha</option>
            {Object.entries(TIPOS_DE_REQUISITO_DO_CONTRATO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="obrigatorio" rotulo="Obrigatório" erro={erros.obrigatorio}>
          <Selecao
            id="obrigatorio"
            name="obrigatorio"
            defaultValue={r && !r.obrigatorio ? "nao" : "sim"}
            className={campo}
          >
            <option value="sim">Sim</option>
            <option value="nao">Não (desejável)</option>
          </Selecao>
        </Campo>
      </div>
      <Campo
        id="descricao"
        rotulo="Requisito do cliente"
        erro={erros.descricao}
      >
        <textarea
          id="descricao"
          name="descricao"
          rows={2}
          maxLength={500}
          defaultValue={d("descricao")}
          className={areaDeTexto}
          aria-invalid={Boolean(erros.descricao)}
        />
      </Campo>
      <Campo
        id="criterioAceitacao"
        rotulo="Critério de aceitação (opcional)"
        erro={erros.criterioAceitacao}
      >
        <input
          id="criterioAceitacao"
          name="criterioAceitacao"
          maxLength={500}
          defaultValue={d("criterioAceitacao")}
          className={campo}
        />
      </Campo>
      <Campo
        id="evidencia"
        rotulo="Evidência ou como é atendido (opcional)"
        erro={erros.evidencia}
      >
        <input
          id="evidencia"
          name="evidencia"
          maxLength={500}
          defaultValue={d("evidencia")}
          className={campo}
        />
      </Campo>
    </>
  );
}

export function NovoRequisitoDoContrato({
  contratoId,
}: {
  contratoId: string;
}) {
  return (
    <Recolhido titulo="Adicionar requisito do cliente">
      <Formulario
        acao={criarRequisito.bind(null, contratoId)}
        versao=""
        rotuloDoBotao="Adicionar requisito"
      >
        {(erros, v) => <CamposDoRequisito erros={erros} v={v} />}
      </Formulario>
    </Recolhido>
  );
}

export function LinhaDoRequisito({
  requisito,
  podeEditar,
}: {
  requisito: RequisitoDoContrato;
  podeEditar: boolean;
}) {
  const r = requisito;
  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-base">
          {r.descricao}
          {!r.obrigatorio && (
            <span className="ml-2 text-sm text-texto-2">· desejável</span>
          )}
        </span>
        <span
          className={`text-sm font-semibold ${COR_DA_SITUACAO[r.situacao]}`}
        >
          {SITUACOES_DO_REQUISITO_DO_CONTRATO[r.situacao]}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-texto-2">
        {TIPOS_DE_REQUISITO_DO_CONTRATO[r.tipo]}
        {r.criterioAceitacao && ` · Critério: ${r.criterioAceitacao}`}
        {r.evidencia && ` · Evidência: ${r.evidencia}`}
      </p>
      {podeEditar && (
        <div className="mt-3">
          <Recolhido titulo="Situação, editar ou remover">
            <Formulario
              acao={situacaoRequisito.bind(null, r.id)}
              versao={r.versao}
              rotuloDoBotao="Salvar situação"
            >
              {(erros) => (
                <Campo
                  id={`sit-${r.id}`}
                  rotulo="Situação"
                  erro={erros.situacao}
                >
                  <Selecao
                    id={`sit-${r.id}`}
                    name="situacao"
                    defaultValue={r.situacao}
                    className={campo}
                  >
                    {Object.entries(SITUACOES_DO_REQUISITO_DO_CONTRATO).map(
                      ([k, n]) => (
                        <option key={k} value={k}>
                          {n}
                        </option>
                      ),
                    )}
                  </Selecao>
                </Campo>
              )}
            </Formulario>
            <div className="mt-4 border-t border-borda pt-4">
              <Formulario
                acao={atualizarRequisito.bind(null, r.id)}
                versao={r.versao}
                rotuloDoBotao="Salvar requisito"
              >
                {(erros, v) => <CamposDoRequisito erros={erros} v={v} r={r} />}
              </Formulario>
            </div>
            <div className="mt-4 border-t border-borda pt-4">
              <Formulario
                acao={removerRequisito.bind(null, r.id)}
                versao={r.versao}
                rotuloDoBotao="Remover requisito"
                perigo
              >
                {() => (
                  <p className="text-sm text-texto-2">
                    Remove este requisito do contrato.
                  </p>
                )}
              </Formulario>
            </div>
          </Recolhido>
        </div>
      )}
    </li>
  );
}

export function AnaliseCritica({ c }: { c: Contrato }) {
  return (
    <Recolhido
      titulo={
        c.analiseData
          ? "Refazer a análise crítica"
          : "Registrar a análise crítica"
      }
    >
      <Formulario
        acao={analisarContrato.bind(null, c.id)}
        versao={c.versao}
        rotuloDoBotao="Registrar análise"
      >
        {(erros, v) => (
          <>
            <Campo id="conclusao" rotulo="Conclusão" erro={erros.conclusao}>
              <Selecao
                id="conclusao"
                name="conclusao"
                defaultValue={v.conclusao ?? c.analiseConclusao ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.conclusao)}
              >
                <option value="">Escolha</option>
                {Object.entries(CONCLUSOES_DA_ANALISE).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="responsavel"
              rotulo="Responsável pela análise"
              erro={erros.responsavel}
            >
              <input
                id="responsavel"
                name="responsavel"
                list="pessoas"
                maxLength={120}
                defaultValue={v.responsavel ?? c.analiseResponsavel ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.responsavel)}
              />
            </Campo>
            <Campo id="parecer" rotulo="Parecer" erro={erros.parecer}>
              <textarea
                id="parecer"
                name="parecer"
                rows={3}
                maxLength={1000}
                defaultValue={v.parecer ?? c.analiseParecer ?? ""}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.parecer)}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Recolhido>
  );
}
