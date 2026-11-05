"use client";

import type { AuditoriaSimples } from "@davinci/types";
import { Campo } from "@/components/campo";
import {
  EditorDeLinhas,
  type ColunaDoEditor,
} from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { salvarAuditoriaSimples } from "@/lib/acoes-auditoria-simples";
import { hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";

const COLUNAS: ColunaDoEditor[] = [
  { nome: "setor", rotulo: "Setor", largura: "min-w-40", max: 120 },
  { nome: "comentarios", rotulo: "Comentários", largura: "min-w-56", max: 2000 },
  {
    nome: "pontosPositivos",
    rotulo: "Pontos Positivos",
    largura: "min-w-48",
    max: 2000,
  },
  {
    nome: "observacoes",
    rotulo: "Observações",
    largura: "min-w-48",
    max: 2000,
  },
  {
    nome: "naoConformidade",
    rotulo: "Não Conformidade",
    largura: "min-w-48",
    max: 2000,
  },
];

export function FormularioDaAuditoriaSimples({
  auditoria,
}: {
  auditoria?: AuditoriaSimples;
}) {
  return (
    <Formulario
      acao={salvarAuditoriaSimples.bind(null, auditoria?.id ?? null)}
      versao={auditoria?.versao ?? ""}
      rotuloDoBotao={auditoria ? "Salvar alterações" : "Criar auditoria"}
    >
      {(erros, v) => (
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="data" rotulo="Data" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                max={hojeEmBrasilia()}
                defaultValue={v.data ?? auditoria?.data ?? hojeEmBrasilia()}
                className={campo}
              />
            </Campo>
            <Campo id="horario" rotulo="Horário" erro={erros.horario}>
              <input
                id="horario"
                name="horario"
                maxLength={20}
                placeholder="Ex.: 09h às 12h"
                defaultValue={v.horario ?? auditoria?.horario ?? ""}
                className={campo}
              />
            </Campo>
            <Campo
              id="unidade"
              rotulo="Unidade de Negócios"
              erro={erros.unidade}
            >
              <input
                id="unidade"
                name="unidade"
                maxLength={120}
                defaultValue={v.unidade ?? auditoria?.unidade ?? ""}
                className={campo}
              />
            </Campo>
            <Campo
              id="setoresEnvolvidos"
              rotulo="Setores Envolvidos"
              erro={erros.setoresEnvolvidos}
              className="sm:col-span-2"
            >
              <input
                id="setoresEnvolvidos"
                name="setoresEnvolvidos"
                maxLength={300}
                defaultValue={
                  v.setoresEnvolvidos ?? auditoria?.setoresEnvolvidos ?? ""
                }
                className={campo}
              />
            </Campo>
            <Campo id="auditores" rotulo="Auditores" erro={erros.auditores}>
              <input
                id="auditores"
                name="auditores"
                maxLength={300}
                defaultValue={v.auditores ?? auditoria?.auditores ?? ""}
                className={campo}
              />
            </Campo>
            <Campo
              id="areaFoco"
              rotulo="Área Foco"
              erro={erros.areaFoco}
              className="sm:col-span-3"
            >
              <textarea
                id="areaFoco"
                name="areaFoco"
                rows={2}
                maxLength={1000}
                defaultValue={v.areaFoco ?? auditoria?.areaFoco ?? ""}
                className={areaDeTexto}
              />
            </Campo>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-texto-2">
              Por setor
            </p>
            <EditorDeLinhas
              colunas={COLUNAS}
              iniciais={
                auditoria?.linhas.map((l) => ({
                  setor: l.setor,
                  comentarios: l.comentarios ?? "",
                  pontosPositivos: l.pontosPositivos ?? "",
                  observacoes: l.observacoes ?? "",
                  naoConformidade: l.naoConformidade ?? "",
                })) ?? []
              }
              erros={erros}
              prefixo="linhas"
              rotuloDaLinha="Setor"
            />
          </div>
        </div>
      )}
    </Formulario>
  );
}
