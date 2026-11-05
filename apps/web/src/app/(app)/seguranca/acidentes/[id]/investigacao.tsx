"use client";

import { COMPONENTES_ITMA, type Acidente } from "@davinci/types";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { registrarInvestigacao } from "@/lib/acoes-sst";
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
