"use client";

import { useState, useTransition } from "react";
import {
  PAPEIS_NA_BRIGADA,
  type Brigadista,
  type FuncionarioResumo,
  type PlanoDeEmergencia,
} from "@davinci/types";
import { Campo } from "@/components/campo";
import { EditorDeLinhas } from "@/components/editor-de-linhas";
import { Formulario } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  incluirBrigadista,
  retirarBrigadista,
  salvarPlanoDeEmergencia,
} from "@/lib/acoes-sst";
import { areaDeTexto, campo } from "@/lib/estilos";

export function NovoBrigadista({
  funcionarios,
  hoje,
}: {
  funcionarios: FuncionarioResumo[];
  hoje: string;
}) {
  return (
    <Formulario
      acao={incluirBrigadista}
      versao=""
      rotuloDoBotao="Incluir na brigada"
    >
      {(erros, v) => (
        <div className="grid gap-4 sm:grid-cols-4">
          <Campo
            id="funcionarioId"
            rotulo="Funcionário"
            erro={erros.funcionarioId}
            className="sm:col-span-2"
          >
            <Selecao
              id="funcionarioId"
              name="funcionarioId"
              defaultValue={v.funcionarioId ?? ""}
              className={campo}
            >
              <option value="">Escolha</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} · {f.setorNome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo id="papel" rotulo="Papel" erro={erros.papel}>
            <Selecao
              id="papel"
              name="papel"
              defaultValue={v.papel ?? "brigadista"}
              className={campo}
            >
              {Object.entries(PAPEIS_NA_BRIGADA).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo id="turno" rotulo="Turno" erro={erros.turno}>
            <input
              id="turno"
              name="turno"
              maxLength={40}
              defaultValue={v.turno}
              className={campo}
            />
          </Campo>
          <Campo
            id="treinadoEm"
            rotulo="Treinamento de brigada em"
            erro={erros.treinadoEm}
            ajuda="Reciclagem anual (NBR 14276)."
          >
            <input
              id="treinadoEm"
              name="treinadoEm"
              type="date"
              max={hoje}
              defaultValue={v.treinadoEm ?? hoje}
              className={campo}
            />
          </Campo>
        </div>
      )}
    </Formulario>
  );
}

export function RetirarBrigadista({ b }: { b: Brigadista }) {
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      {erro && <span className="text-nao-conforme">{erro}</span>}
      {confirmar ? (
        <>
          <button
            type="button"
            disabled={pendente}
            className="font-semibold text-nao-conforme hover:underline"
            onClick={() =>
              iniciar(async () => setErro(await retirarBrigadista(b.id)))
            }
          >
            Confirmar
          </button>
          <button
            type="button"
            className="text-texto-2 hover:underline"
            onClick={() => setConfirmar(false)}
          >
            Manter
          </button>
        </>
      ) : (
        <button
          type="button"
          aria-label={`Retirar ${b.nome} da brigada`}
          className="text-texto-2 hover:text-nao-conforme hover:underline"
          onClick={() => setConfirmar(true)}
        >
          Retirar
        </button>
      )}
    </span>
  );
}

export function PlanoDeEmergenciaForm({
  plano: p,
}: {
  plano: PlanoDeEmergencia | null;
}) {
  return (
    <Formulario
      acao={salvarPlanoDeEmergencia}
      versao={p?.versao ?? ""}
      rotuloDoBotao="Salvar plano de emergência"
    >
      {(erros, v) => {
        const t = (
          k: keyof PlanoDeEmergencia,
          rotulo: string,
          linhas: number,
          ajuda?: string,
        ) => (
          <Campo id={k} rotulo={rotulo} erro={erros[k]} ajuda={ajuda}>
            <textarea
              id={k}
              name={k}
              rows={linhas}
              defaultValue={v[k] ?? (p?.[k] as string | null) ?? ""}
              className={areaDeTexto}
            />
          </Campo>
        );
        return (
          <>
            {t(
              "cenarios",
              "Cenários de emergência",
              3,
              "Incêndio, vazamento, explosão, emergência médica, desastre natural…",
            )}
            {t("alarme", "Alarme e comunicação", 2)}
            {t("rotasDeFuga", "Rotas de fuga", 2)}
            <Campo
              id="pontoDeEncontro"
              rotulo="Ponto de encontro"
              erro={erros.pontoDeEncontro}
            >
              <input
                id="pontoDeEncontro"
                name="pontoDeEncontro"
                maxLength={300}
                defaultValue={v.pontoDeEncontro ?? p?.pontoDeEncontro ?? ""}
                className={campo}
              />
            </Campo>
            {t(
              "procedimentos",
              "Procedimentos",
              5,
              "Quem faz o quê: abandono, combate, primeiros socorros, isolamento, acionamento externo.",
            )}
            <div>
              <p className="text-sm font-semibold text-texto-2">
                Contatos de emergência
              </p>
              <EditorDeLinhas
                colunas={[
                  { nome: "nome", rotulo: "Nome", max: 120 },
                  { nome: "telefone", rotulo: "Telefone", max: 30 },
                ]}
                iniciais={
                  p?.contatos ?? [
                    { nome: "Bombeiros", telefone: "193" },
                    { nome: "SAMU", telefone: "192" },
                  ]
                }
                erros={erros}
                prefixo="contatos"
                rotuloDaLinha="Contato"
              />
            </div>
          </>
        );
      }}
    </Formulario>
  );
}
