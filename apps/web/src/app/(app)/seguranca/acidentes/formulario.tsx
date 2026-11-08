"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  TIPOS_ACIDENTE,
  type Acidente,
  type TipoAcidente,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import { salvarAcidente, type EstadoDaAcao } from "@/lib/acoes-acidentes";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

/** Registrar (sem `acidente`) ou corrigir um registro. Os campos de lesão e afastamento seguem o tipo escolhido. */
export function FormularioDeAcidente({
  acidente,
  hoje,
  embutido = false,
}: {
  acidente?: Acidente;
  hoje: string;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarAcidente.bind(null, acidente?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> =
    estado.valores ??
    Object.fromEntries(
      Object.entries(acidente ?? {}).map(([k, x]) => [
        k,
        x === null || typeof x === "boolean" ? "" : String(x),
      ]),
    );
  const [tipo, setTipo] = useState<TipoAcidente | "">(
    (v.tipo as TipoAcidente) || "",
  );
  const comLesao = tipo === "com_afastamento" || tipo === "sem_afastamento";
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  // Depois de um envio com erro, leva a tela até o primeiro campo com problema:
  // em formulário longo, o aviso no topo passava despercebido (SST-01).
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!estado.erro) return;
    const alvo = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    (alvo ?? formRef.current)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    alvo?.focus?.({ preventScroll: true });
  }, [estado]);
  const texto = (
    nome: string,
    rotulo: string,
    max: number,
    extra: {
      ajuda?: string;
      classe?: string;
      lista?: "pessoas" | "setores";
      obrigatorio?: boolean;
      minimo?: number;
    } = {},
  ) => (
    <Campo
      id={nome}
      rotulo={rotulo}
      erro={erros[nome]}
      ajuda={extra.ajuda}
      className={extra.classe}
    >
      <input
        id={nome}
        name={nome}
        required={extra.obrigatorio}
        minLength={extra.minimo}
        defaultValue={v[nome]}
        maxLength={max}
        list={extra.lista}
        className={campo}
        aria-invalid={Boolean(erros[nome])}
      />
    </Campo>
  );
  return (
    <form
      ref={formRef}
      action={acao}
      noValidate
      className={embutido ? "" : "mt-6"}
    >
      {acidente && (
        <input type="hidden" name="versao" value={acidente.versao} />
      )}
      {erroGeral && (
        <div className="mb-5">
          <AvisoDeErro erro={erroGeral} />
        </div>
      )}
      <CadastroEmBlocos
        embutido={embutido}
        acoesEmbutido={
          <Botao type="submit" disabled={salvando} variante="primario">
            {salvando
              ? "Salvando…"
              : acidente
                ? "Salvar registro"
                : "Registrar"}
          </Botao>
        }
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Data", campo: "data" },
          { rotulo: "Local", campo: "local" },
          { rotulo: "Acidentado", campo: "acidentado", vazio: "Não se aplica" },
        ]}
        acoes={
          <>
            <Botao href="/seguranca/acidentes" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando
                ? "Salvando…"
                : acidente
                  ? "Salvar registro"
                  : "Registrar"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="evento"
          titulo="O evento"
          descricao="Tipo, quando, onde e a sequência dos fatos."
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
                <Selecao
                  id="tipo"
                  required
                  name="tipo"
                  defaultValue={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoAcidente)}
                  className={campo}
                  aria-invalid={Boolean(erros.tipo)}
                >
                  <option value="" disabled>
                    Escolha
                  </option>
                  {Object.entries(TIPOS_ACIDENTE).map(([chave, nome]) => (
                    <option key={chave} value={chave}>
                      {nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
              <Campo id="data" rotulo="Data" erro={erros.data}>
                <input
                  id="data"
                  required
                  name="data"
                  type="date"
                  max={hoje}
                  defaultValue={v.data ?? hoje}
                  className={campo}
                  aria-invalid={Boolean(erros.data)}
                />
              </Campo>
              <Campo id="hora" rotulo="Hora" erro={erros.hora}>
                <input
                  id="hora"
                  name="hora"
                  type="time"
                  defaultValue={v.hora}
                  className={campo}
                  aria-invalid={Boolean(erros.hora)}
                />
              </Campo>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {texto("local", "Local exato", 150, {
                ajuda: "Ex.: Linha 2, prensa P-04",
                obrigatorio: true,
                minimo: 3,
              })}
              {texto("setor", "Setor", 100, { lista: "setores" })}
            </div>
            <Campo
              id="descricao"
              rotulo="O que aconteceu"
              erro={erros.descricao}
              ajuda="A sequência dos fatos: o que a pessoa fazia, o que deu errado, o resultado."
            >
              <textarea
                id="descricao"
                name="descricao"
                required
                minLength={10}
                rows={4}
                defaultValue={v.descricao}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.descricao)}
              />
            </Campo>
          </div>
        </Bloco>
        {comLesao && (
          <Bloco
            id="pessoa"
            titulo="Pessoa e lesão"
            descricao="Quem se acidentou e qual foi a lesão."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {texto("acidentado", "Acidentado", 120, {
                lista: "pessoas",
                obrigatorio: true,
              })}
              {texto("funcao", "Função", 100)}
              {texto("lesao", "Natureza da lesão", 200, {
                ajuda: "Ex.: corte, contusão, fratura",
              })}
              {texto("parteDoCorpo", "Parte do corpo", 100)}
            </div>
          </Bloco>
        )}
        <Bloco
          id="causa"
          titulo="Causa e resposta"
          descricao="O que causou o evento, o afastamento e o que foi feito na hora."
        >
          <div className="flex flex-col gap-5">
            {texto("agenteCausador", "Agente causador", 200, {
              ajuda:
                "Máquina, ferramenta, substância ou condição que causou o evento.",
            })}
            {tipo === "com_afastamento" && (
              <div className="grid gap-5 sm:grid-cols-3">
                <Campo
                  id="diasPerdidos"
                  rotulo="Dias perdidos"
                  erro={erros.diasPerdidos}
                  ajuda="Dias de afastamento, sem contar o dia do acidente."
                >
                  <input
                    id="diasPerdidos"
                    name="diasPerdidos"
                    required
                    inputMode="numeric"
                    defaultValue={v.diasPerdidos ?? ""}
                    className={campo}
                    aria-invalid={Boolean(erros.diasPerdidos)}
                  />
                </Campo>
                <Campo
                  id="diasDebitados"
                  rotulo="Dias debitados (NBR 14280)"
                  erro={erros.diasDebitados}
                  ajuda="Só em morte ou incapacidade permanente."
                >
                  <input
                    id="diasDebitados"
                    name="diasDebitados"
                    inputMode="numeric"
                    defaultValue={v.diasDebitados ?? "0"}
                    className={campo}
                    aria-invalid={Boolean(erros.diasDebitados)}
                  />
                </Campo>
              </div>
            )}
            <Campo
              id="medidasImediatas"
              rotulo="Medidas imediatas"
              erro={erros.medidasImediatas}
              ajuda="Primeiros socorros, isolamento da área, bloqueio do equipamento."
            >
              <textarea
                id="medidasImediatas"
                name="medidasImediatas"
                rows={2}
                defaultValue={v.medidasImediatas}
                className={areaDeTexto}
              />
            </Campo>
            {texto("testemunhas", "Testemunhas", 500)}
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
