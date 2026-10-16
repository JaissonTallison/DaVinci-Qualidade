"use client";

import { RESULTADOS_ASO, TIPOS_ASO } from "@davinci/types";
import { Campo } from "@/components/campo";
import { EditorDeLinhas } from "@/components/editor-de-linhas";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import { registrarAso } from "@/lib/acoes-exames-e-treinamentos";
import { hojeEmBrasilia } from "@/lib/datas";
import { campo } from "@/lib/estilos";

export function RegistrarAso({
  funcionarioId,
  versao,
}: {
  funcionarioId: string;
  versao: string;
}) {
  return (
    <Recolhido titulo="Registrar ASO">
      <Formulario
        acao={registrarAso.bind(null, funcionarioId)}
        versao={versao}
        rotuloDoBotao="Registrar ASO"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="tipo" rotulo="Tipo de exame" erro={erros.tipo}>
              <Selecao
                id="tipo"
                name="tipo"
                defaultValue={v.tipo ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.tipo)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_ASO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="data" rotulo="Data do exame" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                max={hojeEmBrasilia()}
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
                aria-invalid={Boolean(erros.data)}
              />
            </Campo>
            <Campo id="resultado" rotulo="Resultado" erro={erros.resultado}>
              <Selecao
                id="resultado"
                name="resultado"
                defaultValue={v.resultado ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.resultado)}
              >
                <option value="">Escolha</option>
                {Object.entries(RESULTADOS_ASO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="proximoExame"
              rotulo="Próximo exame (vencimento)"
              erro={erros.proximoExame}
              ajuda="Em branco só no demissional."
            >
              <input
                id="proximoExame"
                name="proximoExame"
                type="date"
                defaultValue={v.proximoExame}
                className={campo}
                aria-invalid={Boolean(erros.proximoExame)}
              />
            </Campo>
            <Campo id="medico" rotulo="Médico (opcional)" erro={erros.medico}>
              <input
                id="medico"
                name="medico"
                maxLength={120}
                defaultValue={v.medico}
                className={campo}
              />
            </Campo>
            <Campo id="crm" rotulo="CRM (opcional)" erro={erros.crm}>
              <input
                id="crm"
                name="crm"
                maxLength={20}
                defaultValue={v.crm}
                className={`${campo} font-mono`}
              />
            </Campo>
            <Campo id="ufCrm" rotulo="UF do CRM" erro={erros.ufCrm}>
              <input
                id="ufCrm"
                name="ufCrm"
                maxLength={2}
                defaultValue={v.ufCrm}
                className={`${campo} uppercase`}
              />
            </Campo>
            <div className="sm:col-span-3">
              <p className="text-sm font-semibold text-texto-2">
                Exames realizados (para o eSocial S-2220)
              </p>
              <EditorDeLinhas
                colunas={[
                  {
                    nome: "data",
                    rotulo: "Data",
                    tipo: "data",
                    largura: "min-w-36",
                  },
                  {
                    nome: "procedimento",
                    rotulo: "Procedimento (tabela 27, 4 dígitos)",
                    largura: "min-w-56",
                    max: 4,
                  },
                ]}
                iniciais={[]}
                erros={erros}
                prefixo="exames"
                rotuloDaLinha="Exame"
                comLinhaVazia={false}
              />
            </div>
            <Campo
              id="observacao"
              rotulo="Observação ou restrição (opcional)"
              erro={erros.observacao}
              className="sm:col-span-3"
            >
              <input
                id="observacao"
                name="observacao"
                maxLength={300}
                defaultValue={v.observacao}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Recolhido>
  );
}
