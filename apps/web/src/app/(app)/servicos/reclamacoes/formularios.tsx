"use client";

import {
  CANAIS_DE_RECLAMACAO,
  GRAVIDADES_NC,
  type OrdemDeServico,
  type ParceiroResumo,
  type Reclamacao,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  analisarReclamacao,
  criarReclamacao,
  encerrarReclamacao,
  responderReclamacao,
} from "@/lib/acoes-servicos";
import { areaDeTexto, campo } from "@/lib/estilos";
import { EscolhaDeParceiro } from "../escolha-de-parceiro";

export function NovaReclamacao({
  clientes,
  ordens,
  hoje,
}: {
  clientes: ParceiroResumo[];
  ordens: OrdemDeServico[];
  hoje: string;
}) {
  return (
    <Formulario
      acao={criarReclamacao}
      versao=""
      rotuloDoBotao="Registrar reclamação"
    >
      {(erros, v) => (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo
              id="clienteId"
              rotulo="Cliente"
              erro={erros.clienteId}
              className="sm:col-span-2"
            >
              <EscolhaDeParceiro
                id="clienteId"
                parceiros={clientes}
                valor={v.clienteId}
                invalido={Boolean(erros.clienteId)}
              />
            </Campo>
            <Campo id="canal" rotulo="Canal" erro={erros.canal}>
              <Selecao
                id="canal"
                name="canal"
                defaultValue={v.canal ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {Object.entries(CANAIS_DE_RECLAMACAO).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="recebidaEm" rotulo="Recebida em" erro={erros.recebidaEm}>
              <input
                id="recebidaEm"
                name="recebidaEm"
                type="date"
                max={hoje}
                defaultValue={v.recebidaEm ?? hoje}
                className={campo}
              />
            </Campo>
            <Campo
              id="produto"
              rotulo="Produto ou serviço"
              erro={erros.produto}
              className="sm:col-span-2"
            >
              <input
                id="produto"
                name="produto"
                maxLength={150}
                defaultValue={v.produto}
                className={campo}
              />
            </Campo>
            <Campo id="osId" rotulo="Ordem de serviço" erro={erros.osId}>
              <Selecao
                id="osId"
                name="osId"
                defaultValue={v.osId ?? ""}
                className={campo}
              >
                <option value="">Sem OS</option>
                {ordens.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero} · {o.clienteNome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="prazoResposta"
              rotulo="Responder até"
              erro={erros.prazoResposta}
              ajuda="Em branco: 7 dias do recebimento."
            >
              <input
                id="prazoResposta"
                name="prazoResposta"
                type="date"
                defaultValue={v.prazoResposta}
                className={campo}
              />
            </Campo>
          </div>
          <Campo
            id="descricao"
            rotulo="O que o cliente relatou"
            erro={erros.descricao}
          >
            <textarea
              id="descricao"
              name="descricao"
              rows={4}
              maxLength={2000}
              defaultValue={v.descricao}
              className={areaDeTexto}
            />
          </Campo>
        </>
      )}
    </Formulario>
  );
}

const simNao = (
  nome: string,
  rotulo: string,
  erro: string | undefined,
  valor?: string,
) => (
  <fieldset>
    <legend className="text-sm font-semibold text-texto-2">{rotulo}</legend>
    <div className="mt-1.5 flex gap-5 text-base">
      {[
        ["sim", "Sim"],
        ["nao", "Não"],
      ].map(([k, n]) => (
        <label key={k} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={nome}
            value={k}
            defaultChecked={valor === k}
            className="size-4 accent-primaria"
          />
          {n}
        </label>
      ))}
    </div>
    {erro && <p className="mt-1 text-sm text-nao-conforme">{erro}</p>}
  </fieldset>
);

export function AnalisarReclamacao({ r }: { r: Reclamacao }) {
  return (
    <Bloco
      titulo="Análise"
      descricao="A reclamação procede? Procedente pode abrir a não conformidade na Qualidade, com o relato e a análise."
    >
      <Formulario
        acao={analisarReclamacao.bind(null, r.id)}
        versao={r.versao}
        rotuloDoBotao="Registrar análise"
      >
        {(erros, v) => (
          <>
            {simNao(
              "procedente",
              "Procede?",
              erros.procedente,
              v.procedente ??
                (r.procedente === null
                  ? undefined
                  : r.procedente
                    ? "sim"
                    : "nao"),
            )}
            <Campo id="analise" rotulo="Análise" erro={erros.analise}>
              <textarea
                id="analise"
                name="analise"
                rows={3}
                maxLength={2000}
                defaultValue={v.analise ?? r.analise ?? ""}
                className={areaDeTexto}
              />
            </Campo>
            {!r.ncId && (
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="inline-flex items-center gap-2 self-end pb-2 text-base">
                  <input
                    type="checkbox"
                    name="abrirNc"
                    value="sim"
                    defaultChecked={v.abrirNc === "sim"}
                    className="size-4 accent-primaria"
                  />
                  Abrir NC na Qualidade
                </label>
                <Campo
                  id="responsavelNc"
                  rotulo="Responsável pela NC"
                  erro={erros.responsavelNc}
                >
                  <input
                    id="responsavelNc"
                    name="responsavelNc"
                    list="pessoas"
                    maxLength={120}
                    defaultValue={v.responsavelNc}
                    className={campo}
                  />
                </Campo>
                <Campo
                  id="gravidadeNc"
                  rotulo="Gravidade"
                  erro={erros.gravidadeNc}
                >
                  <Selecao
                    id="gravidadeNc"
                    name="gravidadeNc"
                    defaultValue={v.gravidadeNc ?? "media"}
                    className={campo}
                  >
                    {Object.entries(GRAVIDADES_NC).map(([k, n]) => (
                      <option key={k} value={k}>
                        {n}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              </div>
            )}
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

export function ResponderReclamacao({ r }: { r: Reclamacao }) {
  return (
    <Bloco
      titulo="Resposta ao cliente"
      descricao="O que foi comunicado ao cliente: a solução, a correção e o que muda para não se repetir."
    >
      <Formulario
        acao={responderReclamacao.bind(null, r.id)}
        versao={r.versao}
        rotuloDoBotao="Registrar resposta"
      >
        {(erros, v) => (
          <Campo id="resposta" rotulo="Resposta" erro={erros.resposta}>
            <textarea
              id="resposta"
              name="resposta"
              rows={4}
              maxLength={2000}
              defaultValue={v.resposta}
              className={areaDeTexto}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function EncerrarReclamacao({ r }: { r: Reclamacao }) {
  return (
    <Bloco
      titulo="Encerrar"
      descricao="Confirme com o cliente se a solução atendeu."
    >
      <Formulario
        acao={encerrarReclamacao.bind(null, r.id)}
        versao={r.versao}
        rotuloDoBotao="Encerrar reclamação"
      >
        {(erros, v) => (
          <>
            {simNao(
              "clienteSatisfeito",
              "O cliente ficou satisfeito com a solução?",
              erros.clienteSatisfeito,
              v.clienteSatisfeito,
            )}
            <Campo id="observacao" rotulo="Observação" erro={erros.observacao}>
              <input
                id="observacao"
                name="observacao"
                maxLength={500}
                defaultValue={v.observacao}
                className={campo}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}
