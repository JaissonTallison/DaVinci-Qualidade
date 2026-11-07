"use client";

import { useActionState, useState, type ReactNode } from "react";
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
  campo,
  erroDoCampo,
  painel,
  rotulo,
  trilho,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { ORIGEM_VINCULAVEL } from "@/lib/origem-nc";

/** Agrupa campos relacionados sob um subtítulo sóbrio, para o cadastro ler como etapas. */
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-texto-2">{titulo}</h2>
      {children}
    </section>
  );
}

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
  /** Processos ou áreas cadastrados (Cadastros › Listas de apoio). */
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
  const semOrigem = !origem;
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
      <div className="flex flex-col gap-8 p-5">
        {erroGeral && <AvisoDeErro erro={erroGeral} />}

        <Secao titulo="O problema">
          <Campo
            id="titulo"
            rotulo="Título *"
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
            rotulo="O que aconteceu *"
            erro={erros.descricao}
            ajuda="Fatos e evidência objetiva: o que foi visto, onde, quando e qual requisito não foi atendido. Fotos e documentos são anexados depois de abrir, na própria NC."
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
        </Secao>

        <Secao titulo="Classificação">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="origem" rotulo="Origem *" erro={erros.origem}>
              <Opcoes
                id="origem"
                opcoes={ORIGENS_NC}
                valor={v.origem}
                onChange={(e) => setOrigem(e.target.value)}
                {...invalido("origem")}
              />
            </Campo>
            <Campo id="tipo" rotulo="Tipo *" erro={erros.tipo}>
              <Opcoes
                id="tipo"
                opcoes={TIPOS_NC}
                valor={v.tipo}
                {...invalido("tipo")}
              />
            </Campo>
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className={rotulo}>Gravidade *</legend>
            <div className={trilho} role="radiogroup" aria-label="Gravidade">
              {Object.entries(GRAVIDADES_NC).map(([chave, nome]) => (
                <label key={chave} className="flex-1">
                  <input
                    type="radio"
                    name="gravidade"
                    value={chave}
                    defaultChecked={v.gravidade === chave}
                    className="peer sr-only"
                  />
                  <span className="flex cursor-pointer items-center justify-center rounded-sm px-3.5 py-1.5 text-base text-texto-2 transition-colors hover:bg-superficie/70 hover:text-texto peer-checked:bg-superficie peer-checked:font-semibold peer-checked:text-marinho peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-marinho/40">
                    {nome}
                  </span>
                </label>
              ))}
            </div>
            {erros.gravidade && (
              <p id="erro-gravidade" className={erroDoCampo}>
                {erros.gravidade}
              </p>
            )}
          </fieldset>
          <Campo
            id="origemRef"
            rotulo={vinc ? vinc.rotuloCampo : "Registro de origem"}
            erro={erros.origemRef}
            className="sm:w-1/2"
            ajuda={
              semOrigem
                ? "Escolha a origem primeiro."
                : vinc
                  ? registros.length > 0
                    ? "Selecione ou digite o número."
                    : "Digite o número do registro."
                  : "Número ou código do registro."
            }
          >
            <input
              id="origemRef"
              name="origemRef"
              defaultValue={v.origemRef}
              maxLength={60}
              disabled={semOrigem}
              placeholder={semOrigem ? "Escolha a origem primeiro" : undefined}
              className={`${campo} font-mono disabled:cursor-not-allowed disabled:opacity-60`}
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
        </Secao>

        <Secao titulo="Onde ocorreu">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <Campo id="processo" rotulo="Processo ou área" erro={erros.processo}>
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
                  placeholder="Cadastre em Cadastros › Listas de apoio"
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
        </Secao>

        <Secao titulo="Responsável e prazo">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="responsavel"
              rotulo="Responsável *"
              erro={erros.responsavel}
              ajuda="Quem vai conduzir o tratamento."
            >
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
            <Campo id="prazo" rotulo="Prazo *" erro={erros.prazo}>
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
          </div>
        </Secao>

        <Secao titulo="Tratamento inicial (opcional)">
          <Campo
            id="contencao"
            rotulo="Contenção imediata"
            erro={erros.contencao}
            ajuda="O que já foi feito para conter o efeito (segregar o lote, parar a linha)."
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
        </Secao>

        <p className="text-sm text-texto-3">
          Os campos com <span aria-hidden>*</span> são obrigatórios.
        </p>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
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
