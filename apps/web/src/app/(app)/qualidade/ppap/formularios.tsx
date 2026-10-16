"use client";

import {
  ELEMENTOS_DO_PPAP,
  MOTIVOS_DO_PPAP,
  NIVEIS_DO_PPAP,
  STATUS_DO_ELEMENTO,
  type FmeaResumo,
  type PlanoDeControleResumo,
  type Ppap,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  criarPpap,
  decidirPpap,
  salvarPpap,
  submeterPpap,
} from "@/lib/acoes-automotivo";
import { areaDeTexto, campo, campoCompacto } from "@/lib/estilos";

const EXIGENCIA = {
  submeter: "Submeter",
  reter: "Reter",
  a_pedido: "A pedido",
} as const;

type Ligacoes = { fmeas: FmeaResumo[]; planos: PlanoDeControleResumo[] };

function Cabecalho({
  erros,
  v,
  p,
  fmeas,
  planos,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  p?: Ppap;
} & Ligacoes) {
  const valor = (k: keyof Ppap) =>
    v[k] ?? (p?.[k] === null || p?.[k] === undefined ? "" : String(p[k]));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Campo id="peca" rotulo="Peça" erro={erros.peca}>
        <input
          id="peca"
          name="peca"
          defaultValue={valor("peca")}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo
        id="numeroDaPeca"
        rotulo="Número da peça"
        erro={erros.numeroDaPeca}
      >
        <input
          id="numeroDaPeca"
          name="numeroDaPeca"
          defaultValue={valor("numeroDaPeca")}
          maxLength={60}
          className={`${campo} font-mono`}
        />
      </Campo>
      <Campo
        id="revisaoDoDesenho"
        rotulo="Revisão do desenho"
        erro={erros.revisaoDoDesenho}
      >
        <input
          id="revisaoDoDesenho"
          name="revisaoDoDesenho"
          defaultValue={valor("revisaoDoDesenho")}
          maxLength={20}
          className={campo}
        />
      </Campo>
      <Campo id="cliente" rotulo="Cliente" erro={erros.cliente}>
        <input
          id="cliente"
          name="cliente"
          defaultValue={valor("cliente")}
          maxLength={150}
          className={campo}
        />
      </Campo>
      <Campo
        id="nivel"
        rotulo="Nível de submissão"
        erro={erros.nivel}
        className="sm:col-span-2"
      >
        <Selecao
          id="nivel"
          name="nivel"
          defaultValue={valor("nivel") || "3"}
          className={campo}
        >
          {Object.entries(NIVEIS_DO_PPAP).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo
        id="motivo"
        rotulo="Motivo da submissão"
        erro={erros.motivo}
        className="sm:col-span-2"
      >
        <Selecao
          id="motivo"
          name="motivo"
          defaultValue={valor("motivo")}
          className={campo}
        >
          <option value="">Escolha</option>
          {Object.entries(MOTIVOS_DO_PPAP).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo
        id="fmeaId"
        rotulo="PFMEA"
        erro={erros.fmeaId}
        className="sm:col-span-2"
      >
        <Selecao
          id="fmeaId"
          name="fmeaId"
          defaultValue={valor("fmeaId")}
          className={campo}
        >
          <option value="">Sem ligação</option>
          {fmeas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.numero} · {f.titulo}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo
        id="planoDeControleId"
        rotulo="Plano de controle"
        erro={erros.planoDeControleId}
        className="sm:col-span-2"
      >
        <Selecao
          id="planoDeControleId"
          name="planoDeControleId"
          defaultValue={valor("planoDeControleId")}
          className={campo}
        >
          <option value="">Sem ligação</option>
          {planos.map((x) => (
            <option key={x.id} value={x.id}>
              {x.numero} · {x.titulo}
            </option>
          ))}
        </Selecao>
      </Campo>
    </div>
  );
}

export function NovoPpap(props: Ligacoes) {
  return (
    <Formulario acao={criarPpap} versao="" rotuloDoBotao="Abrir PPAP">
      {(erros, v) => <Cabecalho erros={erros} v={v} {...props} />}
    </Formulario>
  );
}

/** Cabeçalho e os 18 elementos, com status e observação; salvar volta o PPAP rejeitado para preparação. */
export function EditorDoPpap({ ppap: p, ...props }: { ppap: Ppap } & Ligacoes) {
  return (
    <Formulario
      acao={salvarPpap.bind(null, p.id)}
      versao={p.versao}
      rotuloDoBotao="Salvar PPAP"
    >
      {(erros, v) => (
        <>
          <Cabecalho erros={erros} v={v} p={p} {...props} />
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-texto-2">
                  <th className="py-2 pr-3 font-semibold">Elemento</th>
                  <th className="py-2 pr-3 font-semibold">
                    No nível {p.nivel}
                  </th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">
                    Observação ou justificativa
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.elementos.map((e, i) => (
                  <tr
                    key={e.elemento}
                    className="border-b border-borda last:border-0"
                  >
                    <td className="py-1.5 pr-3">
                      <span className="text-texto-3 tabular-nums">
                        {i + 1}.
                      </span>{" "}
                      {ELEMENTOS_DO_PPAP[e.elemento]}
                    </td>
                    <td
                      className={`py-1.5 pr-3 whitespace-nowrap ${e.exigencia === "submeter" ? "font-semibold" : "text-texto-2"}`}
                    >
                      {EXIGENCIA[e.exigencia]}
                    </td>
                    <td className="py-1.5 pr-3">
                      <select
                        name={`status_${e.elemento}`}
                        defaultValue={v[`status_${e.elemento}`] ?? e.status}
                        aria-label={`Status: ${ELEMENTOS_DO_PPAP[e.elemento]}`}
                        className={`${campoCompacto} w-40`}
                      >
                        {Object.entries(STATUS_DO_ELEMENTO).map(([k, n]) => (
                          <option key={k} value={k}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5">
                      <input
                        name={`obs_${e.elemento}`}
                        defaultValue={v[`obs_${e.elemento}`] ?? e.observacao}
                        maxLength={300}
                        aria-label={`Observação: ${ELEMENTOS_DO_PPAP[e.elemento]}`}
                        className={`${campoCompacto} w-full`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-texto-2">
            Submeter: vai ao cliente. Reter: fica na empresa, disponível. A
            pedido: o cliente decide (nível 4). Não aplicável só vale com
            justificativa.
          </p>
        </>
      )}
    </Formulario>
  );
}

export function SubmeterPpap({ ppap: p, hoje }: { ppap: Ppap; hoje: string }) {
  return (
    <Bloco
      titulo="Submeter ao cliente"
      descricao={
        p.pendentesParaSubmeter
          ? `Faltam ${p.pendentesParaSubmeter} elemento(s) a submeter: conclua ou justifique antes.`
          : "Todos os elementos do nível estão prontos. Registre a data de envio ao cliente."
      }
    >
      <Formulario
        acao={submeterPpap.bind(null, p.id)}
        versao={p.versao}
        rotuloDoBotao="Registrar submissão"
      >
        {(erros, v) => (
          <Campo id="data" rotulo="Data de submissão" erro={erros.data}>
            <input
              id="data"
              name="data"
              type="date"
              max={hoje}
              defaultValue={v.data ?? hoje}
              className={`${campo} w-48`}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function DecisaoDoCliente({ ppap: p }: { ppap: Ppap }) {
  return (
    <Bloco
      titulo="Decisão do cliente"
      descricao="Registre o que o cliente decidiu no PSW: aprovado, aprovação provisória ou rejeitado."
    >
      <Formulario
        acao={decidirPpap.bind(null, p.id)}
        versao={p.versao}
        rotuloDoBotao="Registrar decisão"
      >
        {(erros, v) => (
          <>
            <Campo id="decisao" rotulo="Decisão" erro={erros.decisao}>
              <Selecao
                id="decisao"
                name="decisao"
                defaultValue={v.decisao ?? ""}
                className={`${campo} w-64`}
              >
                <option value="">Escolha</option>
                <option value="aprovado">Aprovado</option>
                <option value="aprovacao_provisoria">
                  Aprovação provisória
                </option>
                <option value="rejeitado">Rejeitado</option>
              </Selecao>
            </Campo>
            <Campo
              id="parecer"
              rotulo="Parecer do cliente"
              erro={erros.parecer}
            >
              <textarea
                id="parecer"
                name="parecer"
                rows={3}
                defaultValue={v.parecer}
                className={areaDeTexto}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}
