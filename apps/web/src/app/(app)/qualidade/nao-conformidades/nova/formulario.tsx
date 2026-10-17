"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  GRAVIDADES_NC,
  ORIGENS_NC,
  TIPOS_NC,
  type OrigemNc,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import { abrirNc, type EstadoDaAcao } from "@/lib/acoes-nc";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { ORIGEM_VINCULAVEL } from "@/lib/origem-nc";

export function FormularioNovaNc({
  hoje,
  inicial,
  setores,
  processos,
  registrosPorOrigem,
}: {
  hoje: string;
  inicial?: Record<string, string>;
  /** Setores cadastrados, para selecionar em vez de digitar. */
  setores: string[];
  /** Processos ou áreas cadastrados (Cadastros › Listas de cadastro). */
  processos: string[];
  /** Registros de cada origem vinculável, para selecionar o "Registro de origem". */
  registrosPorOrigem: Partial<
    Record<OrigemNc, { numero: string; desc: string }[]>
  >;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    abrirNc,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? inicial ?? {};
  // Origem escolhida: define o autocomplete do "Registro de origem"
  const [origem, setOrigem] = useState(v.origem ?? "");
  const vinc = ORIGEM_VINCULAVEL[origem as OrigemNc];
  const registros = registrosPorOrigem[origem as OrigemNc] ?? [];
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const invalido = (nome: string) => ({
    "aria-invalid": Boolean(erros[nome]),
    "aria-describedby": erros[nome] ? `erro-${nome}` : undefined,
  });

  return (
    <form action={acao} noValidate className={`${painel} mt-6`}>
      <div className="flex flex-col gap-5 p-5">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}
        <Campo
          id="titulo"
          rotulo="Título"
          erro={erros.titulo}
          ajuda="Uma frase que identifique a NC na lista."
        >
          <input
            id="titulo"
            name="titulo"
            defaultValue={v.titulo}
            maxLength={150}
            className={campo}
            {...invalido("titulo")}
          />
        </Campo>
        <Campo
          id="descricao"
          rotulo="O que aconteceu"
          erro={erros.descricao}
          ajuda="Fatos e evidência objetiva: o que foi visto, onde, quando e qual requisito não foi atendido."
        >
          <textarea
            id="descricao"
            name="descricao"
            defaultValue={v.descricao}
            rows={4}
            className={areaDeTexto}
            {...invalido("descricao")}
          />
        </Campo>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo id="origem" rotulo="Origem" erro={erros.origem}>
            <Opcoes
              id="origem"
              opcoes={ORIGENS_NC}
              valor={v.origem}
              onChange={(e) => setOrigem(e.target.value)}
              {...invalido("origem")}
            />
          </Campo>
          <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
            <Opcoes
              id="tipo"
              opcoes={TIPOS_NC}
              valor={v.tipo}
              {...invalido("tipo")}
            />
          </Campo>
          <Campo id="gravidade" rotulo="Gravidade" erro={erros.gravidade}>
            <Opcoes
              id="gravidade"
              opcoes={GRAVIDADES_NC}
              valor={v.gravidade}
              {...invalido("gravidade")}
            />
          </Campo>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo
            id="origemRef"
            rotulo={vinc ? vinc.rotuloCampo : "Registro de origem"}
            erro={erros.origemRef}
            ajuda={
              vinc
                ? registros.length > 0
                  ? "Selecione ou digite o número."
                  : "Digite o número do registro."
                : "Ex.: AUD-2026-003"
            }
          >
            <input
              id="origemRef"
              name="origemRef"
              defaultValue={v.origemRef}
              maxLength={60}
              className={`${campo} font-mono`}
              list={vinc && registros.length > 0 ? "registros-origem" : undefined}
              autoComplete="off"
            />
            {vinc && registros.length > 0 && (
              <datalist id="registros-origem">
                {registros.map((r) => (
                  <option key={r.numero} value={r.numero} label={r.desc} />
                ))}
              </datalist>
            )}
          </Campo>
          <Campo id="setor" rotulo="Setor" erro={erros.setor}>
            {setores.length > 0 ? (
              <Selecao
                id="setor"
                name="setor"
                defaultValue={v.setor ?? ""}
                className={campo}
              >
                <option value="">Selecione o setor</option>
                {/* Setor que veio pré-preenchido (acidente, calibração) mas não está no cadastro */}
                {v.setor && !setores.includes(v.setor) && (
                  <option value={v.setor}>{v.setor}</option>
                )}
                {setores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Selecao>
            ) : (
              <input
                id="setor"
                name="setor"
                defaultValue={v.setor}
                maxLength={100}
                className={campo}
                placeholder="Cadastre setores em Cadastros › Setores e funções"
              />
            )}
          </Campo>
          <Campo
            id="processo"
            rotulo="Processo ou área"
            erro={erros.processo}
          >
            {processos.length > 0 ? (
              <Selecao
                id="processo"
                name="processo"
                defaultValue={v.processo ?? ""}
                className={campo}
              >
                <option value="">Selecione o processo</option>
                {v.processo && !processos.includes(v.processo) && (
                  <option value={v.processo}>{v.processo}</option>
                )}
                {processos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Selecao>
            ) : (
              <input
                id="processo"
                name="processo"
                defaultValue={v.processo}
                maxLength={100}
                className={campo}
                placeholder="Cadastre em Cadastros › Listas de cadastro"
              />
            )}
          </Campo>
          <Campo id="produto" rotulo="Produto ou serviço" erro={erros.produto}>
            <input
              id="produto"
              name="produto"
              defaultValue={v.produto}
              maxLength={150}
              className={campo}
            />
          </Campo>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo id="responsavel" rotulo="Responsável" erro={erros.responsavel}>
            <input
              id="responsavel"
              name="responsavel"
              list="pessoas"
              defaultValue={v.responsavel}
              maxLength={120}
              className={campo}
              {...invalido("responsavel")}
            />
          </Campo>
          <Campo id="prazo" rotulo="Prazo" erro={erros.prazo}>
            <input
              id="prazo"
              name="prazo"
              type="date"
              min={hoje}
              defaultValue={v.prazo}
              className={campo}
              {...invalido("prazo")}
            />
          </Campo>
          <Campo id="lote" rotulo="Lote" erro={erros.lote}>
            <input
              id="lote"
              name="lote"
              defaultValue={v.lote}
              maxLength={60}
              className={`${campo} font-mono`}
            />
          </Campo>
        </div>
        <Campo
          id="contencao"
          rotulo="Contenção imediata"
          erro={erros.contencao}
          ajuda="O que já foi feito para conter o efeito (segregar o lote, parar a linha). Pode ficar em branco."
        >
          <textarea
            id="contencao"
            name="contencao"
            defaultValue={v.contencao}
            rows={2}
            className={areaDeTexto}
          />
        </Campo>
        <Campo
          id="custoEstimado"
          rotulo="Custo estimado da falha (R$)"
          erro={erros.custoEstimado}
          className="sm:w-1/3"
        >
          <input
            id="custoEstimado"
            name="custoEstimado"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={v.custoEstimado}
            className={campo}
            {...invalido("custoEstimado")}
          />
        </Campo>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/qualidade/nao-conformidades" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Abrindo…" : "Abrir NC"}
        </button>
      </div>
    </form>
  );
}

function Opcoes({
  id,
  opcoes,
  valor,
  ...resto
}: {
  id: string;
  opcoes: Record<string, string>;
  valor?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Selecao
      id={id}
      name={id}
      defaultValue={valor ?? ""}
      className={campo}
      {...resto}
    >
      <option value="" disabled>
        Escolha
      </option>
      {Object.entries(opcoes).map(([chave, nome]) => (
        <option key={chave} value={chave}>
          {nome}
        </option>
      ))}
    </Selecao>
  );
}
