"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import {
  GRANDEZAS_DE_MEDICAO,
  RAMOS_DE_CALIBRACAO,
  type Instrumento,
  type ItemDoCatalogoDeCalibracao,
  type RamoDeCalibracao,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { salvarInstrumento, type EstadoDaAcao } from "@/lib/acoes-calibracao";
import { botaoPrimario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { CATALOGO_DE_CALIBRACAO } from "./catalogo";

/**
 * Campos de texto, na ordem em que aparecem, agrupados por etapa (`grupo`).
 * `tag`, `grandeza` e `frequenciaMeses` são tratados à parte, nas suas etapas.
 */
const CAMPOS = [
  {
    nome: "descricao",
    rotulo: "Descrição *",
    grupo: "identificacao",
    max: 150,
    colunas: "sm:col-span-2",
    ajuda: "Ex.: Paquímetro digital 150 mm",
  },
  { nome: "fabricante", rotulo: "Fabricante", grupo: "identificacao", max: 80 },
  { nome: "modelo", rotulo: "Modelo", grupo: "identificacao", max: 80 },
  {
    nome: "numeroSerie",
    rotulo: "Número de série",
    grupo: "identificacao",
    max: 60,
    mono: true,
  },
  {
    nome: "unidade",
    rotulo: "Unidade",
    grupo: "medicao",
    max: 20,
    ajuda: "Ex.: mm, °C, kg",
  },
  {
    nome: "faixa",
    rotulo: "Faixa de medição",
    grupo: "medicao",
    max: 80,
    ajuda: "Ex.: 0 a 150 mm",
  },
  {
    nome: "criterioAceitacao",
    rotulo: "Critério de aceitação",
    grupo: "medicao",
    max: 200,
    colunas: "sm:col-span-2",
    ajuda: "É com ele que o certificado é aprovado ou reprovado. Ex.: ± 0,02 mm.",
  },
  {
    nome: "erroMaximoAdmissivel",
    rotulo: "Erro máximo admissível (EMA)",
    grupo: "medicao",
    max: 200,
    ajuda: "Ex.: ± 0,02 mm",
  },
  {
    nome: "incerteza",
    rotulo: "Incerteza",
    grupo: "medicao",
    max: 120,
    ajuda: "Ex.: U = 0,01 mm (k=2)",
  },
  {
    nome: "classeExatidao",
    rotulo: "Classe de exatidão",
    grupo: "medicao",
    max: 60,
    ajuda: "Ex.: Classe II (OIML R76)",
  },
  {
    nome: "normaReferencia",
    rotulo: "Norma de referência",
    grupo: "medicao",
    max: 160,
    colunas: "sm:col-span-2",
    ajuda: "Ex.: ABNT NBR ISO 10012",
  },
  {
    nome: "local",
    rotulo: "Local",
    grupo: "local",
    max: 120,
    lista: "setores",
  },
  {
    nome: "responsavel",
    rotulo: "Responsável",
    grupo: "local",
    max: 120,
    lista: "pessoas",
  },
] as const;

/** Agrupa campos relacionados sob um subtítulo sóbrio, com uma orientação curta. */
function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-texto-2">{titulo}</h2>
        <p className="mt-0.5 text-sm text-texto-3">{descricao}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">{children}</div>
    </section>
  );
}

/** Preenche os campos do formulário a partir de um item do catálogo. */
function doModelo(item: ItemDoCatalogoDeCalibracao): Record<string, string> {
  return {
    tag: item.tagSugerida ? `${item.tagSugerida}-` : "",
    descricao: item.instrumento,
    grandeza: item.grandeza,
    unidade: item.unidade,
    faixa: item.faixa,
    criterioAceitacao: item.criterioAceitacao,
    normaReferencia: item.normaReferencia,
    frequenciaMeses: String(item.frequenciaMeses),
  };
}

/** Cadastrar (sem `instrumento`) ou editar um instrumento. */
export function FormularioDeInstrumento({
  instrumento,
  embutido = false,
}: {
  instrumento?: Instrumento;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarInstrumento.bind(null, instrumento?.id ?? null),
    {},
  );
  // Catálogo (só no cadastro novo): escolher um modelo preenche os campos.
  const [ramo, setRamo] = useState<RamoDeCalibracao | "">("");
  const [modelo, setModelo] = useState<Record<string, string> | null>(null);
  const [montagem, setMontagem] = useState(0);
  // Em qual envio o modelo foi aplicado: enquanto não houver um envio novo, o modelo
  // preenche os campos e os erros antigos ficam ocultos. Depois de enviar, o que a pessoa
  // digitou passa a valer mais que o modelo (QUA-01/QUA-04).
  const [envioDoModelo, setEnvioDoModelo] = useState<EstadoDaAcao | null>(null);
  const modeloAtivo = modelo !== null && envioDoModelo === estado;

  const erros = errosPorCampo(modeloAtivo ? [] : estado.erro?.detalhes);
  const base: Record<string, string> =
    estado.valores ??
    Object.fromEntries(
      Object.entries(instrumento ?? {}).map(([k, x]) => [
        k,
        x === null || typeof x === "object" ? "" : String(x),
      ]),
    );
  const erroGeral =
    !modeloAtivo && estado.erro && !estado.erro.detalhes?.length
      ? estado.erro
      : undefined;

  const itensDoRamo = ramo
    ? CATALOGO_DE_CALIBRACAO.filter((i) => i.ramos.includes(ramo))
    : [];
  const v = modeloAtivo ? { ...base, ...modelo } : base;
  const valor = (nome: string) => v[nome] ?? "";

  const renderCampos = (grupo: string) =>
    CAMPOS.filter((c) => c.grupo === grupo).map((c) => (
      <Campo
        key={c.nome}
        id={c.nome}
        rotulo={c.rotulo}
        erro={erros[c.nome]}
        ajuda={"ajuda" in c ? c.ajuda : undefined}
        className={"colunas" in c ? c.colunas : ""}
      >
        <input
          id={c.nome}
          name={c.nome}
          list={"lista" in c ? c.lista : undefined}
          defaultValue={valor(c.nome)}
          maxLength={c.max}
          className={`${campo} ${"mono" in c ? "font-mono" : ""}`}
          aria-invalid={Boolean(erros[c.nome])}
        />
      </Campo>
    ));

  return (
    <form action={acao} noValidate className={embutido ? "" : `${painel} mt-6`}>
      {instrumento && (
        <input type="hidden" name="versao" value={instrumento.versao} />
      )}

      {!instrumento && (
        <div
          className={`border-b border-borda ${embutido ? "mb-5 pb-5" : "px-5 pt-5 pb-5"}`}
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-texto">
            <Sparkles aria-hidden size={16} strokeWidth={2} className="text-acao" />
            Começar de um modelo do seu ramo (opcional)
          </p>
          <p className="mt-1 text-sm text-texto-2">
            Escolha o ramo e o instrumento: os campos abaixo são preenchidos com
            valores típicos (grandeza, faixa, critério, frequência, norma). Você
            ajusta tudo ao seu equipamento.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Ramo"
              value={ramo}
              onChange={(e) => {
                setRamo(e.target.value as RamoDeCalibracao | "");
                setModelo(null);
              }}
              className={campo}
            >
              <option value="">Ramo…</option>
              {Object.entries(RAMOS_DE_CALIBRACAO).map(([k, nome]) => (
                <option key={k} value={k}>
                  {nome}
                </option>
              ))}
            </select>
            <select
              aria-label="Instrumento do catálogo"
              value=""
              disabled={!ramo}
              onChange={(e) => {
                const i = itensDoRamo[Number(e.target.value)];
                if (i) {
                  setModelo(doModelo(i));
                  setMontagem((m) => m + 1);
                  setEnvioDoModelo(estado);
                }
              }}
              className={`${campo} disabled:opacity-60`}
            >
              <option value="">
                {ramo ? "Escolha o instrumento…" : "Escolha o ramo primeiro"}
              </option>
              {itensDoRamo.map((i, idx) => (
                <option key={idx} value={idx}>
                  {i.instrumento} · {GRANDEZAS_DE_MEDICAO[i.grandeza]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div
        key={montagem}
        className={`flex flex-col gap-8 ${embutido ? "" : "p-5"}`}
      >
        {erroGeral && <AvisoDeErro erro={erroGeral} />}

        <Secao
          titulo="Identificação do instrumento"
          descricao="Como o instrumento é identificado na empresa."
        >
          <Campo
            id="tag"
            rotulo="TAG *"
            erro={erros.tag}
            ajuda="Única na empresa. Ex.: PAQ-0042"
          >
            <input
              id="tag"
              name="tag"
              defaultValue={valor("tag")}
              maxLength={30}
              className={`${campo} font-mono uppercase`}
              aria-invalid={Boolean(erros.tag)}
            />
          </Campo>
          {renderCampos("identificacao")}
        </Secao>

        <Secao
          titulo="Características e critérios de medição"
          descricao="O que ele mede e o critério que aprova ou reprova a calibração."
        >
          <Campo id="grandeza" rotulo="Grandeza" erro={erros.grandeza}>
            <select
              id="grandeza"
              name="grandeza"
              defaultValue={valor("grandeza")}
              className={campo}
              aria-invalid={Boolean(erros.grandeza)}
            >
              <option value="">—</option>
              {Object.entries(GRANDEZAS_DE_MEDICAO).map(([k, nome]) => (
                <option key={k} value={k}>
                  {nome}
                </option>
              ))}
            </select>
          </Campo>
          {renderCampos("medicao")}
        </Secao>

        <Secao
          titulo="Localização e responsável"
          descricao="Onde o instrumento fica e quem responde por ele."
        >
          {renderCampos("local")}
        </Secao>

        <Secao
          titulo="Frequência e dados de calibração"
          descricao="A última e a próxima calibração são registradas depois, na tela do instrumento."
        >
          <Campo
            id="frequenciaMeses"
            rotulo="Frequência de calibração (meses) *"
            erro={erros.frequenciaMeses}
          >
            <input
              id="frequenciaMeses"
              name="frequenciaMeses"
              inputMode="numeric"
              defaultValue={valor("frequenciaMeses") || "12"}
              className={campo}
              aria-invalid={Boolean(erros.frequenciaMeses)}
            />
          </Campo>
        </Secao>

        <p className="text-sm text-texto-3">
          Os campos com <span aria-hidden>*</span> são obrigatórios.
        </p>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : instrumento
              ? "Salvar instrumento"
              : "Cadastrar instrumento"}
        </button>
      </div>
    </form>
  );
}
