"use client";

import { useActionState, useState } from "react";
import {
  aspectoSignificativo,
  INCIDENCIAS,
  SITUACOES_OPERACIONAIS,
  significanciaDoAspecto,
  type AspectoAmbiental,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { SignificanciaDoAspecto } from "@/components/marcadores-ambientais";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

const SEVERIDADES = {
  1: "1 · Desprezível",
  2: "2 · Baixa",
  3: "3 · Moderada",
  4: "4 · Alta",
  5: "5 · Crítica",
};
const FREQUENCIAS = {
  1: "1 · Rara",
  2: "2 · Ocasional",
  3: "3 · Mensal",
  4: "4 · Semanal",
  5: "5 · Contínua ou diária",
};

/** Cadastro e edição do aspecto. A significância aparece enquanto a pessoa escolhe as notas. */
export function FormularioDeAspecto({
  acao,
  aspecto,
}: {
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>;
  aspecto?: AspectoAmbiental;
}) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    atividade: aspecto?.atividade ?? "",
    aspecto: aspecto?.aspecto ?? "",
    impacto: aspecto?.impacto ?? "",
    situacao: aspecto?.situacao ?? "normal",
    incidencia: aspecto?.incidencia ?? "direta",
    severidade: aspecto ? String(aspecto.severidade) : "",
    frequencia: aspecto ? String(aspecto.frequencia) : "",
    requisitoLegal: aspecto?.requisitoLegal ? "sim" : "",
    controles: aspecto?.controles ?? "",
    acoes: aspecto?.acoes ?? "",
    responsavel: aspecto?.responsavel ?? "",
    prazo: aspecto?.prazo ?? "",
  };
  const [sev, setSev] = useState(Number(v.severidade) || 0);
  const [freq, setFreq] = useState(Number(v.frequencia) || 0);
  const [legal, setLegal] = useState(v.requisitoLegal === "sim");
  const temNotas = sev > 0 && freq > 0;
  const significativo = temNotas && aspectoSignificativo(sev, freq, legal);
  const texto = (id: string, rotulo: string, max: number, className = "") => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]} className={className}>
      <input
        id={id}
        required={!rotulo.includes("(opcional)")}
        name={id}
        maxLength={max}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  const area = (id: string, rotulo: string) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]} className="sm:col-span-3">
      <textarea
        id={id}
        required={!rotulo.includes("(opcional)")}
        name={id}
        rows={3}
        maxLength={1000}
        defaultValue={v[id]}
        className={areaDeTexto}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate className={aspecto ? "" : "mt-6"}>
      {aspecto && <input type="hidden" name="versao" value={aspecto.versao} />}
      <CadastroEmBlocos
        embutido={Boolean(aspecto)}
        acoesEmbutido={
          <>
            <Botao type="submit" disabled={salvando} variante="primario">
              {salvando
                ? "Salvando…"
                : aspecto
                  ? "Salvar alterações"
                  : "Cadastrar aspecto"}
            </Botao>
          </>
        }
        resumo={[
          { rotulo: "Atividade", campo: "atividade" },
          { rotulo: "Severidade", campo: "severidade" },
          { rotulo: "Frequência", campo: "frequencia" },
          { rotulo: "Responsável", campo: "responsavel" },
        ]}
        acoes={
          <>
            <Botao href="/ambiental/aspectos" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando
                ? "Salvando…"
                : aspecto
                  ? "Salvar alterações"
                  : "Cadastrar aspecto"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="aspecto"
          titulo="Aspecto e impacto"
          descricao="Atividade, o que ela gera ou consome e o efeito no meio ambiente."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            {texto("atividade", "Atividade ou processo", 150)}
            {texto(
              "aspecto",
              "Aspecto (o que gera ou consome)",
              200,
              "sm:col-span-2",
            )}
            {texto("impacto", "Impacto no meio ambiente", 200, "sm:col-span-2")}
          </div>
        </Bloco>
        <Bloco
          id="avaliacao"
          titulo="Avaliação"
          descricao="Situação, incidência e as notas que definem a significância."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="situacao" rotulo="Situação" erro={erros.situacao}>
              <Selecao
                id="situacao"
                required
                name="situacao"
                defaultValue={v.situacao}
                className={campo}
              >
                {Object.entries(SITUACOES_OPERACIONAIS).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="incidencia" rotulo="Incidência" erro={erros.incidencia}>
              <Selecao
                id="incidencia"
                required
                name="incidencia"
                defaultValue={v.incidencia}
                className={campo}
              >
                {Object.entries(INCIDENCIAS).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="severidade" rotulo="Severidade" erro={erros.severidade}>
              <Selecao
                id="severidade"
                required
                name="severidade"
                defaultValue={v.severidade}
                onChange={(e) => setSev(Number(e.target.value))}
                className={campo}
                aria-invalid={Boolean(erros.severidade)}
              >
                <option value="">Escolha</option>
                {Object.entries(SEVERIDADES).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="frequencia" rotulo="Frequência" erro={erros.frequencia}>
              <Selecao
                id="frequencia"
                required
                name="frequencia"
                defaultValue={v.frequencia}
                onChange={(e) => setFreq(Number(e.target.value))}
                className={campo}
                aria-invalid={Boolean(erros.frequencia)}
              >
                <option value="">Escolha</option>
                {Object.entries(FREQUENCIAS).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <div className="flex flex-col justify-end gap-2 sm:col-span-3">
              <label className="inline-flex items-center gap-2 text-base">
                <input
                  type="checkbox"
                  name="requisitoLegal"
                  value="sim"
                  defaultChecked={legal}
                  onChange={(e) => setLegal(e.target.checked)}
                  className="size-4 accent-primaria"
                />
                Há requisito legal ligado a este aspecto
              </label>
              <p className="text-sm text-texto-2" aria-live="polite">
                {temNotas ? (
                  <>
                    Significância {sev * freq}:{" "}
                    <SignificanciaDoAspecto
                      significancia={significanciaDoAspecto(sev, freq)}
                      significativo={significativo}
                    />
                    {significativo &&
                      ". Informe as ações de controle, o responsável e o prazo."}
                  </>
                ) : (
                  "Escolha severidade e frequência para ver a significância. Alta (15 ou mais) ou com requisito legal é significativo."
                )}
              </p>
            </div>
          </div>
        </Bloco>
        <Bloco
          id="controle"
          titulo="Controle"
          descricao="O que já existe, o que será feito, por quem e até quando."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {area("controles", "Controles que já existem (opcional)")}
            {area(
              "acoes",
              significativo
                ? "Ações de controle"
                : "Ações de controle (opcional)",
            )}
            {texto(
              "responsavel",
              significativo ? "Responsável" : "Responsável (opcional)",
              120,
              "sm:col-span-2",
            )}
            <Campo
              id="prazo"
              rotulo={significativo ? "Prazo" : "Prazo (opcional)"}
              erro={erros.prazo}
            >
              <input
                id="prazo"
                required={significativo}
                name="prazo"
                type="date"
                defaultValue={v.prazo}
                className={campo}
                aria-invalid={Boolean(erros.prazo)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
