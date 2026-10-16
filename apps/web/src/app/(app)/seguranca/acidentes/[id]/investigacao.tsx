"use client";

import {
  COMPONENTES_ITMA,
  LATERALIDADES,
  LOCAIS_DO_ACIDENTE,
  ORGAOS_DO_ATESTADO,
  TIPOS_DE_ACIDENTE_ESOCIAL,
  type Acidente,
  type FuncionarioResumo,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { registrarDadosCat, registrarInvestigacao } from "@/lib/acoes-sst";
import { campo, tituloDaSecao } from "@/lib/estilos";

const TESTEMUNHAS: ColunaDoEditor[] = [
  { nome: "nome", rotulo: "Nome", max: 120 },
  { nome: "funcao", rotulo: "Função", max: 100 },
  { nome: "relato", rotulo: "Relato", largura: "min-w-96", max: 2000 },
];
const FATOS: ColunaDoEditor[] = [
  { nome: "fato", rotulo: "Fato", largura: "min-w-80", max: 300 },
  {
    nome: "componente",
    rotulo: "Componente",
    tipo: "opcoes",
    opcoes: COMPONENTES_ITMA,
    largura: "min-w-32",
  },
  {
    nome: "antecedentes",
    rotulo: "Decorre dos fatos nº",
    largura: "min-w-32",
    max: 40,
  },
];

/** Testemunhas, 5 porquês e árvore de causas (ITMa), enquanto a investigação está aberta. */
export function InvestigacaoEstruturada({
  acidente: a,
}: {
  acidente: Acidente;
}) {
  const i = a.investigacao;
  return (
    <Formulario
      acao={registrarInvestigacao.bind(null, a.id)}
      versao={a.versao}
      rotuloDoBotao="Salvar investigação"
    >
      {(erros, v) => (
        <>
          <div>
            <h3 className={tituloDaSecao}>Testemunhas</h3>
            <EditorDeLinhas
              colunas={TESTEMUNHAS}
              iniciais={i.testemunhas}
              erros={erros}
              prefixo="testemunhas"
              rotuloDaLinha="Testemunha"
              comLinhaVazia={false}
            />
          </div>
          <fieldset>
            <legend className={tituloDaSecao}>5 porquês</legend>
            <ol className="mt-2 flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-texto-2">
                    Por quê {n}?
                  </span>
                  <input
                    name={`porque${n}`}
                    defaultValue={v[`porque${n}`] ?? i.porques[n - 1] ?? ""}
                    maxLength={300}
                    aria-label={`Por quê ${n}`}
                    className={campo}
                  />
                </li>
              ))}
            </ol>
          </fieldset>
          <div>
            <h3 className={tituloDaSecao}>Árvore de causas</h3>
            <p className="text-sm text-texto-2">
              Do acidente para trás: cada fato com o componente (Indivíduo,
              Tarefa, Material, Meio) e os números dos fatos que levaram a ele,
              separados por vírgula. O fato 1 é a lesão.
            </p>
            <EditorDeLinhas
              colunas={FATOS}
              iniciais={i.fatos.map((f) => ({
                fato: f.fato,
                componente: f.componente,
                antecedentes: f.antecedentes.join(", "),
              }))}
              erros={erros}
              prefixo="fatos"
              rotuloDaLinha="Fato"
            />
          </div>
        </>
      )}
    </Formulario>
  );
}

const opcoes = (o: Record<string | number, string>) =>
  Object.entries(o).map(([k, n]) => (
    <option key={k} value={k}>
      {n}
    </option>
  ));

/** Complemento do S-2210: o que o eSocial pede além do registro do acidente. Códigos das tabelas oficiais. */
export function DadosDaCatEsocial({
  acidente: a,
  funcionarios,
}: {
  acidente: Acidente;
  funcionarios: FuncionarioResumo[];
}) {
  const c = a.dadosCat;
  const hora = (x?: string | null) =>
    x ? `${x.slice(0, 2)}:${x.slice(2)}` : "";
  return (
    <Formulario
      acao={registrarDadosCat.bind(null, a.id)}
      versao={a.versao}
      rotuloDoBotao="Salvar dados da CAT"
    >
      {(erros, v) => {
        const d = (k: string, padrao = "") =>
          v[k] ??
          (c &&
          (c as Record<string, unknown>)[k] !== null &&
          (c as Record<string, unknown>)[k] !== undefined
            ? String((c as Record<string, unknown>)[k])
            : padrao);
        const texto = (
          k: string,
          rotulo: string,
          extra: {
            max?: number;
            ajuda?: string;
            tipo?: string;
            mono?: boolean;
          } = {},
        ) => (
          <Campo
            id={`cat-${k}`}
            rotulo={rotulo}
            erro={erros[k]}
            ajuda={extra.ajuda}
          >
            <input
              id={`cat-${k}`}
              name={k}
              type={extra.tipo ?? "text"}
              maxLength={extra.max}
              defaultValue={extra.tipo === "time" ? hora(d(k)) : d(k)}
              className={`${campo} ${extra.mono ? "font-mono" : ""}`}
            />
          </Campo>
        );
        const escolha = (
          k: string,
          rotulo: string,
          o: Record<string | number, string>,
          padrao = "",
        ) => (
          <Campo id={`cat-${k}`} rotulo={rotulo} erro={erros[k]}>
            <Selecao
              id={`cat-${k}`}
              name={k}
              defaultValue={d(k, padrao)}
              className={campo}
            >
              <option value="">Escolha</option>
              {opcoes(o)}
            </Selecao>
          </Campo>
        );
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Campo
                id="cat-acidentadoId"
                rotulo="Acidentado (cadastro)"
                erro={erros.acidentadoId}
                className="sm:col-span-2"
              >
                <Selecao
                  id="cat-acidentadoId"
                  name="acidentadoId"
                  defaultValue={d("acidentadoId")}
                  className={campo}
                >
                  <option value="">Escolha</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} · {f.matricula}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              {escolha(
                "tpAcid",
                "Tipo (eSocial)",
                TIPOS_DE_ACIDENTE_ESOCIAL,
                "1",
              )}
              {texto("hrAcid", "Hora do acidente", { tipo: "time" })}
              {texto("hrsTrab", "Horas trabalhadas antes", {
                tipo: "time",
                ajuda: "Desde o início da jornada.",
              })}
              {escolha("tpLocal", "Local", LOCAIS_DO_ACIDENTE, "1")}
              {texto("dscLograd", "Logradouro", { max: 100 })}
              {texto("nrLograd", "Número", { max: 10 })}
              {texto("codMunic", "Município (IBGE)", { max: 7, mono: true })}
              {texto("uf", "UF", { max: 2 })}
              {texto("dscLocal", "Descrição do local", { max: 255 })}
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {texto("codSitGeradora", "Situação geradora (tab. 15)", {
                max: 9,
                mono: true,
              })}
              {texto("codParteAting", "Parte atingida (tab. 13)", {
                max: 9,
                mono: true,
              })}
              {escolha("lateralidade", "Lateralidade", LATERALIDADES, "0")}
              {texto("codAgntCausador", "Agente causador (tab. 14/15)", {
                max: 9,
                mono: true,
              })}
              {escolha(
                "indCatObito",
                "Houve óbito?",
                { N: "Não", S: "Sim" },
                "N",
              )}
              {texto("dtObito", "Data do óbito", { tipo: "date" })}
              {escolha(
                "indComunPolicia",
                "Comunicado à polícia?",
                { N: "Não", S: "Sim" },
                "N",
              )}
            </div>
            <h3 className={tituloDaSecao}>Atestado médico</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {texto("dtAtendimento", "Data do atendimento", { tipo: "date" })}
              {texto("hrAtendimento", "Hora do atendimento", { tipo: "time" })}
              {escolha(
                "indInternacao",
                "Houve internação?",
                { N: "Não", S: "Sim" },
                "N",
              )}
              {texto("durTrat", "Duração do tratamento (dias)", { max: 3 })}
              {texto("dscLesao", "Natureza da lesão (tab. 17)", {
                max: 9,
                mono: true,
              })}
              {texto("codCID", "CID", { max: 4, mono: true })}
              {texto("nmEmit", "Médico", { max: 70 })}
              {escolha("ideOC", "Conselho", ORGAOS_DO_ATESTADO, "1")}
              {texto("nrOC", "Número no conselho", { max: 14 })}
              {texto("ufOC", "UF do conselho", { max: 2 })}
            </div>
            <p className="text-sm text-texto-3">
              Os códigos de 9 dígitos vêm das tabelas 13, 14, 15 e 17 do eSocial
              (portal gov.br).
            </p>
          </>
        );
      }}
    </Formulario>
  );
}
