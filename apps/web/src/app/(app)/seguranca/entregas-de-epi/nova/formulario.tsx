"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  MOTIVOS_ENTREGA,
  type Epi,
  type FuncionarioResumo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { registrarEntrega } from "@/lib/acoes-epis";
import { formatarData, hojeEmBrasilia } from "@/lib/datas";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** EPI com CA vencido aparece desabilitado: a pessoa vê que ele existe e por que não pode escolher. */
export function FormularioDeEntrega({
  funcionarios,
  epis,
  funcionarioId,
  episRecebidos = [],
  voltar,
}: {
  funcionarios: FuncionarioResumo[];
  epis: Epi[];
  funcionarioId?: string;
  /** EPIs que o profissional escolhido já recebeu: usado só para avisar, não bloqueia (SST-06). */
  episRecebidos?: string[];
  voltar: string;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    registrarEntrega,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const hoje = hojeEmBrasilia();
  // O CA precisa valer na data da entrega (NR-6), não hoje: entrega retroativa libera
  // um EPI cujo CA ainda era válido naquela data (SST-05).
  const [data, setData] = useState(v.data ?? hoje);
  // Aviso (não bloqueia): "Primeira entrega" para quem já recebeu aquele EPI costuma ser troca/reposição (SST-06).
  const [epiId, setEpiId] = useState(v.epiId ?? "");
  const [motivo, setMotivo] = useState(v.motivo ?? "");
  const jaRecebeu =
    motivo === "primeira_entrega" &&
    epiId !== "" &&
    episRecebidos.includes(epiId);
  return (
    <form action={acao} noValidate className="mt-6">
      <input type="hidden" name="voltar" value={voltar} />
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Profissional", campo: "funcionarioId" },
          { rotulo: "EPI", campo: "epiId" },
          { rotulo: "Data", campo: "data" },
        ]}
        acoes={
          <>
            <Link href="/seguranca/entregas-de-epi" className={botaoSecundario}>
              Cancelar
            </Link>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando ? "Salvando…" : "Registrar entrega"}
            </button>
          </>
        }
      >
        <Bloco
          id="entrega"
          titulo="Entrega"
          descricao="Quem recebe, qual EPI e quantas unidades."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {erroGeral && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={erroGeral} />
              </div>
            )}
            <Campo
              id="funcionarioId"
              rotulo="Profissional"
              erro={erros.funcionarioId}
              className="sm:col-span-3"
            >
              <Selecao
                id="funcionarioId"
                required
                name="funcionarioId"
                defaultValue={v.funcionarioId ?? funcionarioId ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.funcionarioId)}
              >
                <option value="">Escolha</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.matricula} · {f.nome} · {f.funcaoNome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="epiId"
              rotulo="EPI"
              erro={erros.epiId}
              className="sm:col-span-2"
            >
              <Selecao
                id="epiId"
                required
                name="epiId"
                defaultValue={v.epiId ?? ""}
                onChange={(e) => setEpiId(e.target.value)}
                className={campo}
                aria-invalid={Boolean(erros.epiId)}
              >
                <option value="">Escolha</option>
                {epis.map((e) => {
                  const vencidoNaData = e.validadeCa < data;
                  return (
                    <option key={e.id} value={e.id} disabled={vencidoNaData}>
                      {e.nome} · CA {e.ca}
                      {vencidoNaData
                        ? ` · CA vencido em ${formatarData(e.validadeCa)}`
                        : ""}
                    </option>
                  );
                })}
              </Selecao>
            </Campo>
            <Campo id="quantidade" rotulo="Quantidade" erro={erros.quantidade}>
              <input
                id="quantidade"
                required
                name="quantidade"
                inputMode="numeric"
                defaultValue={v.quantidade ?? "1"}
                className={campo}
                aria-invalid={Boolean(erros.quantidade)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="registro"
          titulo="Data e motivo"
          descricao="Quando e por que o EPI foi entregue."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="data" rotulo="Data da entrega" erro={erros.data}>
              <input
                id="data"
                required
                name="data"
                type="date"
                max={hoje}
                value={data}
                onChange={(ev) => setData(ev.target.value)}
                className={campo}
                aria-invalid={Boolean(erros.data)}
              />
            </Campo>
            <Campo
              id="motivo"
              rotulo="Motivo"
              erro={erros.motivo}
              className="sm:col-span-2"
            >
              <Selecao
                id="motivo"
                required
                name="motivo"
                defaultValue={v.motivo ?? ""}
                onChange={(e) => setMotivo(e.target.value)}
                className={campo}
                aria-invalid={Boolean(erros.motivo)}
              >
                <option value="">Escolha</option>
                {Object.entries(MOTIVOS_ENTREGA).map(([chave, nome]) => (
                  <option key={chave} value={chave}>
                    {nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            {jaRecebeu && (
              <p role="status" className="text-sm text-atencao sm:col-span-3">
                Este profissional já recebeu este EPI antes. Se for reposição ou
                troca, troque o motivo — a entrega não fica bloqueada.
              </p>
            )}
            <label className="flex items-center gap-2 text-base sm:col-span-3">
              <input
                type="checkbox"
                name="termoAssinado"
                value="sim"
                defaultChecked={v.termoAssinado === "sim"}
              />
              O profissional assinou o termo de recebimento
            </label>
            <Campo
              id="observacao"
              rotulo="Observação (opcional)"
              erro={erros.observacao}
              className="sm:col-span-3"
            >
              <textarea
                id="observacao"
                name="observacao"
                rows={2}
                maxLength={500}
                defaultValue={v.observacao}
                className={areaDeTexto}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
