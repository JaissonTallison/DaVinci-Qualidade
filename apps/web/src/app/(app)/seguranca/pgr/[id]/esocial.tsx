"use client";

import { TIPOS_DE_AVALIACAO, type Risco } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { salvarEsocialDoRisco } from "@/lib/acoes-sst";
import { campo } from "@/lib/estilos";

/** Agente nocivo (tabela 24) e avaliação: vão para o S-2240 de quem ocupa as funções ligadas a este risco. */
export function EsocialDoRisco({ risco: r }: { risco: Risco }) {
  const d = r.dadosEsocial;
  return (
    <Formulario
      acao={salvarEsocialDoRisco.bind(null, r.id)}
      versao={r.versao}
      rotuloDoBotao="Salvar dados do eSocial"
    >
      {(erros, v) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo
            id="codAgNoc"
            rotulo="Agente nocivo (tabela 24)"
            erro={erros.codAgNoc}
            ajuda="Ex.: 02.01.001. Sem agente: 09.01.001."
          >
            <input
              id="codAgNoc"
              name="codAgNoc"
              defaultValue={v.codAgNoc ?? d?.codAgNoc ?? ""}
              maxLength={9}
              className={`${campo} font-mono`}
            />
          </Campo>
          <Campo id="tpAval" rotulo="Avaliação" erro={erros.tpAval}>
            <Selecao
              id="tpAval"
              name="tpAval"
              defaultValue={v.tpAval ?? String(d?.tpAval ?? "")}
              className={campo}
            >
              <option value="">Escolha</option>
              {Object.entries(TIPOS_DE_AVALIACAO).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo
            id="tecMedicao"
            rotulo="Técnica de medição"
            erro={erros.tecMedicao}
            ajuda="Quantitativa. Ex.: NHO 01."
          >
            <input
              id="tecMedicao"
              name="tecMedicao"
              defaultValue={v.tecMedicao ?? d?.tecMedicao ?? ""}
              maxLength={40}
              className={campo}
            />
          </Campo>
          <Campo
            id="intConc"
            rotulo="Intensidade ou concentração"
            erro={erros.intConc}
          >
            <input
              id="intConc"
              name="intConc"
              inputMode="decimal"
              defaultValue={v.intConc ?? d?.intConc ?? ""}
              className={campo}
            />
          </Campo>
          <Campo id="limTol" rotulo="Limite de tolerância" erro={erros.limTol}>
            <input
              id="limTol"
              name="limTol"
              inputMode="decimal"
              defaultValue={v.limTol ?? d?.limTol ?? ""}
              className={campo}
            />
          </Campo>
          <Campo
            id="unMed"
            rotulo="Unidade de medida (código)"
            erro={erros.unMed}
            ajuda="Código do leiaute (unMed)."
          >
            <input
              id="unMed"
              name="unMed"
              inputMode="numeric"
              defaultValue={v.unMed ?? d?.unMed ?? ""}
              className={campo}
            />
          </Campo>
        </div>
      )}
    </Formulario>
  );
}
