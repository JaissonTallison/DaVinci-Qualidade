"use client";

import { useState } from "react";
import {
  NORMAS,
  TIPOS_CONSTATACAO,
  TIPOS_DE_DESVIO,
  type Auditoria,
  type ModeloDeNc,
  type PerguntaDaAuditoria,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { registrarConstatacao } from "@/lib/acoes-auditorias";
import { areaDeTexto, campo } from "@/lib/estilos";

/**
 * Achado → constatação. Vindo de uma pergunta, já traz norma, cláusula, processo e a evidência da resposta.
 * Escolher um modelo do banco de NCs preenche a redação, a causa raiz provável, a ação e a evidência de fechamento;
 * tudo continua editável (NC personalizada).
 */
export function RegistrarAchado({
  auditoria,
  pergunta,
  area,
  modelos,
}: {
  auditoria: Auditoria;
  pergunta?: PerguntaDaAuditoria;
  area?: string;
  modelos: ModeloDeNc[];
}) {
  const [codigo, setCodigo] = useState("");
  const k = pergunta?.codigo ?? "avulsa";
  const m = modelos.find((x) => x.codigo === codigo);
  const tipoSugerido =
    pergunta?.resposta === "nao_conforme"
      ? "nc_menor"
      : pergunta
        ? "observacao"
        : "";
  return (
    <Formulario
      acao={registrarConstatacao.bind(null, auditoria.id)}
      versao={auditoria.versao}
      rotuloDoBotao="Registrar constatação"
    >
      {(erros, v) => (
        <>
          <input
            type="hidden"
            name="voltar"
            value={`/auditorias/${auditoria.id}/achados?aviso=constatacao`}
          />
          {pergunta && (
            <input
              type="hidden"
              name="perguntaCodigo"
              value={pergunta.codigo}
            />
          )}
          {m && <input type="hidden" name="modeloCodigo" value={m.codigo} />}
          {modelos.length > 0 && (
            <Campo
              id={`${k}-modelo`}
              rotulo="Modelo do banco de NCs"
              ajuda="Opcional. Preenche a redação; ajuste ao que você viu."
            >
              <Selecao
                id={`${k}-modelo`}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className={campo}
              >
                <option value="">NC personalizada (sem modelo)</option>
                {modelos.map((x) => (
                  <option key={x.codigo} value={x.codigo}>
                    {x.clausula} · {x.titulo}
                    {x.origem === "propria" ? " (própria)" : ""}
                  </option>
                ))}
              </Selecao>
            </Campo>
          )}
          <div key={codigo} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-4">
              <Campo
                id={`${k}-tipo`}
                rotulo="Tipo"
                erro={erros["constatacao.tipo"]}
              >
                <Selecao
                  id={`${k}-tipo`}
                  name="tipo"
                  defaultValue={v.tipo ?? tipoSugerido}
                  className={campo}
                  aria-invalid={Boolean(erros["constatacao.tipo"])}
                >
                  <option value="" disabled>
                    Escolha
                  </option>
                  {Object.entries(TIPOS_CONSTATACAO).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo
                id={`${k}-norma`}
                rotulo="Norma"
                erro={erros["constatacao.norma"]}
              >
                <Selecao
                  id={`${k}-norma`}
                  name="norma"
                  defaultValue={
                    v.norma ??
                    pergunta?.norma ??
                    m?.norma ??
                    auditoria.normas[0]
                  }
                  className={campo}
                >
                  {auditoria.normas.map((n) => (
                    <option key={n} value={n}>
                      {NORMAS[n]}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo
                id={`${k}-clausula`}
                rotulo="Cláusula"
                erro={erros["constatacao.clausula"]}
              >
                <input
                  id={`${k}-clausula`}
                  name="clausula"
                  defaultValue={v.clausula ?? m?.clausula ?? pergunta?.clausula}
                  maxLength={20}
                  className={`${campo} font-mono`}
                />
              </Campo>
              <Campo
                id={`${k}-tipoDesvio`}
                rotulo="Tipo de desvio"
                erro={erros["constatacao.tipoDesvio"]}
              >
                <Selecao
                  id={`${k}-tipoDesvio`}
                  name="tipoDesvio"
                  defaultValue={v.tipoDesvio ?? m?.tipo ?? ""}
                  className={campo}
                >
                  <option value="">Não classificar</option>
                  {Object.entries(TIPOS_DE_DESVIO).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            </div>
            <Campo
              id={`${k}-area`}
              rotulo="Área ou processo"
              erro={erros["constatacao.area"]}
            >
              <input
                id={`${k}-area`}
                name="area"
                defaultValue={v.area ?? area}
                maxLength={120}
                className={campo}
              />
            </Campo>
            <Campo
              id={`${k}-descricao`}
              rotulo="Constatação"
              erro={erros["constatacao.descricao"]}
              ajuda="Requisito + evidência + desvio: o que a norma pede, o que foi visto e onde."
            >
              <textarea
                id={`${k}-descricao`}
                name="descricao"
                rows={3}
                defaultValue={v.descricao ?? m?.descricao}
                className={areaDeTexto}
                aria-invalid={Boolean(erros["constatacao.descricao"])}
              />
            </Campo>
            <Campo
              id={`${k}-evidencia`}
              rotulo="Evidência objetiva"
              erro={erros["constatacao.evidencia"]}
            >
              <textarea
                id={`${k}-evidencia`}
                name="evidencia"
                rows={2}
                defaultValue={v.evidencia ?? pergunta?.evidencia ?? ""}
                className={areaDeTexto}
              />
            </Campo>
            <div className="grid gap-5 lg:grid-cols-3">
              <Campo
                id={`${k}-causaRaiz`}
                rotulo="Causa raiz provável"
                erro={erros["constatacao.causaRaiz"]}
              >
                <textarea
                  id={`${k}-causaRaiz`}
                  name="causaRaiz"
                  rows={3}
                  defaultValue={v.causaRaiz ?? m?.causaRaiz}
                  className={areaDeTexto}
                />
              </Campo>
              <Campo
                id={`${k}-acaoCorretiva`}
                rotulo="Ação corretiva sugerida"
                erro={erros["constatacao.acaoCorretiva"]}
              >
                <textarea
                  id={`${k}-acaoCorretiva`}
                  name="acaoCorretiva"
                  rows={3}
                  defaultValue={v.acaoCorretiva ?? m?.acaoCorretiva}
                  className={areaDeTexto}
                />
              </Campo>
              <Campo
                id={`${k}-evidenciaFechamento`}
                rotulo="Evidência de fechamento esperada"
                erro={erros["constatacao.evidenciaFechamento"]}
              >
                <textarea
                  id={`${k}-evidenciaFechamento`}
                  name="evidenciaFechamento"
                  rows={3}
                  defaultValue={v.evidenciaFechamento ?? m?.evidenciaFechamento}
                  className={areaDeTexto}
                />
              </Campo>
            </div>
          </div>
        </>
      )}
    </Formulario>
  );
}
