"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Contrato, ParceiroResumo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarOs } from "@/lib/acoes-servicos";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Selecao } from "@/components/selecao";
import { EscolhaDeParceiro } from "../../escolha-de-parceiro";

export function FormularioDeOs({
  clientes,
  contratos,
}: {
  clientes: ParceiroResumo[];
  contratos: Contrato[];
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarOs,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={acao} noValidate className="mt-6">
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Cliente", campo: "clienteId" },
          { rotulo: "Prazo", campo: "prazo" },
          { rotulo: "Responsável", campo: "responsavel" },
        ]}
        acoes={
          <>
            <Link href="/servicos/ordens" className={botaoSecundario}>
              Cancelar
            </Link>
            <button type="submit" className={botaoPrimario} disabled={salvando}>
              {salvando ? "Salvando…" : "Abrir ordem de serviço"}
            </button>
          </>
        }
      >
        <Bloco
          id="os"
          titulo="Ordem de serviço"
          descricao="Cliente, título, prazo e responsável."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
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
            <Campo
              id="prazo"
              rotulo="Prazo"
              erro={erros.prazo}
              ajuda={
                contratos.length
                  ? "Com contrato, em branco usa o prazo do SLA."
                  : undefined
              }
            >
              <input
                id="prazo"
                required
                name="prazo"
                type="date"
                defaultValue={v.prazo}
                className={campo}
                aria-invalid={Boolean(erros.prazo)}
              />
            </Campo>
            <Campo
              id="titulo"
              rotulo="Título"
              erro={erros.titulo}
              className="sm:col-span-2"
            >
              <input
                id="titulo"
                required
                name="titulo"
                maxLength={150}
                defaultValue={v.titulo}
                className={campo}
                aria-invalid={Boolean(erros.titulo)}
              />
            </Campo>
            <Campo
              id="responsavel"
              rotulo="Responsável"
              erro={erros.responsavel}
            >
              <input
                id="responsavel"
                required
                name="responsavel"
                list="pessoas"
                maxLength={120}
                defaultValue={v.responsavel}
                className={campo}
                aria-invalid={Boolean(erros.responsavel)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="execucao"
          titulo="Execução"
          descricao="Contrato, o que será feito e o checklist."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {contratos.length > 0 && (
              <Campo
                id="contratoId"
                rotulo="Contrato (SLA)"
                erro={erros.contratoId}
                className="sm:col-span-2"
              >
                <Selecao
                  id="contratoId"
                  required
                  name="contratoId"
                  defaultValue={v.contratoId ?? ""}
                  className={campo}
                >
                  <option value="">Sem contrato</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero} · {c.clienteNome} · SLA{" "}
                      {c.prazoAtendimentoDias} dia(s)
                    </option>
                  ))}
                </Selecao>
              </Campo>
            )}
            <Campo
              id="descricao"
              rotulo="O que será feito"
              erro={erros.descricao}
              className="sm:col-span-3"
            >
              <textarea
                id="descricao"
                required
                name="descricao"
                rows={4}
                maxLength={2000}
                defaultValue={v.descricao}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.descricao)}
              />
            </Campo>
            <Campo
              id="checklist"
              rotulo="Checklist de execução (opcional)"
              erro={erros.checklist}
              ajuda="Um passo por linha. A conclusão da OS exige marcar todos."
              className="sm:col-span-3"
            >
              <textarea
                id="checklist"
                name="checklist"
                rows={5}
                defaultValue={v.checklist}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.checklist)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
