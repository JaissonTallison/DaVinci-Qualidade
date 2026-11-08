"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  CLASSES_RO,
  classeDoRo,
  type ClasseRo,
  type RiscoOuOportunidade,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { ClasseDoRo } from "@/components/marcadores";
import { MatrizDeNivel } from "@/components/matriz-de-nivel";
import {
  BarraDeAcoes,
  ColunaDeResumo,
  SecaoDoCadastro,
  type SituacaoDaSecao,
} from "@/components/pagina-de-cadastro";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarRo } from "@/lib/acoes-sgi";
import { formatarData } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import type { ConfigRo } from "./config";
import { CaixaDeAlerta } from "@/components/caixa-de-alerta";
import { Botao } from "@/components/botao";

const MARCADOR: Record<ClasseRo, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
};

/** Mínimos do esquema (packages/types/src/sgi.ts): processo 2 caracteres, descrição 5. */
const preenchido = (valor: string, minimo = 1) => valor.trim().length >= minimo;

function situacao(faltam: number, total: number): SituacaoDaSecao {
  if (total === 0) return { tipo: "opcional" };
  return faltam === 0 ? { tipo: "completa" } : { tipo: "pendente", faltam };
}

export function FormularioDeRo({
  cfg,
  ro,
  embutido = false,
}: {
  cfg: ConfigRo;
  ro?: RiscoOuOportunidade;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarRo.bind(null, cfg.base, ro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    processo: ro?.processo ?? "",
    descricao: ro?.descricao ?? "",
    contexto: ro?.contexto ?? "",
    controlesExistentes: ro?.controlesExistentes ?? "",
    probabilidade: ro ? String(ro.probabilidade) : "",
    impacto: ro ? String(ro.impacto) : "",
    acao: ro?.acao ?? "",
    responsavel: ro?.responsavel ?? "",
    prazo: ro?.prazo ?? "",
  };
  const [a, setA] = useState(v.probabilidade ?? "");
  const [b, setB] = useState(v.impacto ?? "");
  const [processo, setProcesso] = useState(v.processo ?? "");
  const [descricao, setDescricao] = useState(v.descricao ?? "");
  const [textoDaAcao, setTextoDaAcao] = useState(v.acao ?? "");
  const [responsavel, setResponsavel] = useState(v.responsavel ?? "");
  const [prazo, setPrazo] = useState(v.prazo ?? "");
  const classe = a && b ? classeDoRo(Number(a), Number(b)) : null;
  const acaoObrigatoria = classe === "alta";
  const opcional = (texto: string) =>
    acaoObrigatoria ? texto : `${texto} (opcional)`;

  const nivel = classe ? (
    <span className="inline-flex items-center gap-2 text-texto">
      <span aria-hidden className={`size-2.5 rounded-xs ${MARCADOR[classe]}`} />
      <ClasseDoRo classe={classe} />
      <span className="font-mono text-sm text-texto-2">
        · {a} × {b} = {Number(a) * Number(b)}
      </span>
    </span>
  ) : (
    <span className="text-texto-3">{cfg.classeAjuda}</span>
  );

  // ---------- Campos (os mesmos nos dois modos) ----------
  const campoProcesso = (
    <Campo id="processo" rotulo="Processo" erro={erros.processo}>
      <input
        id="processo"
        name="processo"
        maxLength={120}
        defaultValue={v.processo}
        onChange={(e) => setProcesso(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros.processo)}
      />
    </Campo>
  );
  const campoDescricao = (
    <Campo
      id="descricao"
      rotulo="Descrição"
      erro={erros.descricao}
      ajuda={embutido ? undefined : `${descricao.length}/500 caracteres`}
    >
      <input
        id="descricao"
        name="descricao"
        maxLength={500}
        defaultValue={v.descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros.descricao)}
      />
    </Campo>
  );
  const campoContexto = (
    <Campo
      id="contexto"
      rotulo={`${cfg.contexto} (opcional)`}
      erro={erros.contexto}
    >
      <input
        id="contexto"
        name="contexto"
        maxLength={500}
        defaultValue={v.contexto}
        className={campo}
      />
    </Campo>
  );
  const escolha = (
    id: string,
    nome: "probabilidade" | "impacto",
    eixo: ConfigRo["eixoA"],
    valor: string,
    mudar: (x: string) => void,
  ) => (
    <Campo id={id} rotulo={eixo.rotulo} erro={erros[nome]}>
      <Selecao
        id={id}
        name={nome}
        value={valor}
        onChange={(e) => mudar(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros[nome])}
      >
        <option value="">Escolha</option>
        {Object.entries(eixo.escala).map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </Selecao>
    </Campo>
  );
  const campoEixoA = escolha("eixoA", "probabilidade", cfg.eixoA, a, setA);
  const campoEixoB = escolha("eixoB", "impacto", cfg.eixoB, b, setB);
  const campoControles = cfg.controles ? (
    <Campo
      id="controlesExistentes"
      rotulo={`${cfg.controles} (opcional)`}
      erro={erros.controlesExistentes}
    >
      <textarea
        id="controlesExistentes"
        name="controlesExistentes"
        rows={embutido ? 2 : 3}
        maxLength={1000}
        defaultValue={v.controlesExistentes}
        className={areaDeTexto}
      />
    </Campo>
  ) : null;
  const campoAcao = (
    <Campo id="acao" rotulo={opcional(cfg.acao)} erro={erros.acao}>
      <textarea
        id="acao"
        name="acao"
        rows={embutido ? 2 : 3}
        maxLength={1000}
        defaultValue={v.acao}
        onChange={(e) => setTextoDaAcao(e.target.value)}
        className={areaDeTexto}
        aria-invalid={Boolean(erros.acao)}
      />
    </Campo>
  );
  const campoResponsavel = (
    <Campo
      id="responsavel"
      rotulo={opcional("Responsável")}
      erro={erros.responsavel}
    >
      <input
        id="responsavel"
        name="responsavel"
        list="pessoas"
        maxLength={120}
        defaultValue={v.responsavel}
        onChange={(e) => setResponsavel(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros.responsavel)}
      />
    </Campo>
  );
  const campoPrazo = (
    <Campo id="prazo" rotulo={opcional("Prazo")} erro={erros.prazo}>
      <input
        id="prazo"
        name="prazo"
        type="date"
        defaultValue={v.prazo}
        onChange={(e) => setPrazo(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros.prazo)}
      />
    </Campo>
  );
  const ocultos = (
    <>
      <input type="hidden" name="tipo" value={cfg.tipo} />
      {ro && <input type="hidden" name="versao" value={ro.versao} />}
    </>
  );
  const erroGeral = estado.erro && !estado.erro.detalhes?.length && (
    <AvisoDeErro erro={estado.erro} />
  );
  const textoDoBotao = salvando ? "Salvando…" : ro ? "Salvar" : cfg.registrar;

  // ---------- Modo embutido (edição dentro do detalhe): grade única, como antes ----------
  if (embutido)
    return (
      <form action={acao} noValidate>
        {ocultos}
        <div className="grid gap-5 sm:grid-cols-3">
          {erroGeral && <div className="sm:col-span-3">{erroGeral}</div>}
          <div className="sm:col-span-3">{campoProcesso}</div>
          <div className="sm:col-span-3">{campoDescricao}</div>
          <div className="sm:col-span-3">{campoContexto}</div>
          {campoEixoA}
          {campoEixoB}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-texto-2">
              {cfg.classe}
            </span>
            <span className="flex h-9 items-center">{nivel}</span>
          </div>
          {campoControles && (
            <div className="sm:col-span-3">{campoControles}</div>
          )}
          <div className="sm:col-span-3">{campoAcao}</div>
          <div className="sm:col-span-2">{campoResponsavel}</div>
          {campoPrazo}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Botao type="submit" disabled={salvando} variante="primario">
            {textoDoBotao}
          </Botao>
        </div>
      </form>
    );

  // ---------- Página de cadastro: uma seção por bloco + resumo (interface.md §7.2) ----------
  const faltamIdentificacao =
    Number(!preenchido(processo, 2)) + Number(!preenchido(descricao, 5));
  const faltamAvaliacao = Number(!a) + Number(!b);
  const faltamTratamento = acaoObrigatoria
    ? Number(!preenchido(textoDaAcao)) +
      Number(!preenchido(responsavel)) +
      Number(!prazo)
    : 0;
  const totalObrigatorios = 4 + (acaoObrigatoria ? 3 : 0);
  const faltam = faltamIdentificacao + faltamAvaliacao + faltamTratamento;
  const tituloTratamento =
    cfg.tipo === "risco" ? "Tratamento" : "Aproveitamento";

  const secoes: {
    id: string;
    titulo: string;
    situacao: SituacaoDaSecao;
    descricao: string;
    conteudo: ReactNode;
  }[] = [
    {
      id: "identificacao",
      titulo: "Identificação",
      descricao: `Onde está ${cfg.tipo === "risco" ? "o risco" : "a oportunidade"} e o que pode acontecer.`,
      situacao: situacao(faltamIdentificacao, 2),
      conteudo: (
        <div className="grid gap-5 sm:grid-cols-2">
          {campoProcesso}
          <div className="hidden sm:block" />
          <div className="sm:col-span-2">{campoDescricao}</div>
          <div className="sm:col-span-2">{campoContexto}</div>
        </div>
      ),
    },
    {
      id: "avaliacao",
      titulo: "Avaliação",
      descricao: `${cfg.classeAjuda}. ${cfg.classe} calculado na hora; escolha nos campos ou clique na matriz.`,
      situacao: situacao(faltamAvaliacao, 2),
      conteudo: (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-5">
            {campoEixoA}
            {campoEixoB}
            <div className="rounded-md border border-borda bg-superficie-2 px-4 py-3">
              <p className="text-sm font-semibold text-texto-2">{cfg.classe}</p>
              <p className="mt-1 text-lg">{nivel}</p>
              {acaoObrigatoria && (
                <p className="mt-1 text-sm text-texto-2">{cfg.acaoAlta}</p>
              )}
            </div>
          </div>
          <MatrizDeNivel
            eixoA={cfg.eixoA.rotulo}
            eixoB={cfg.eixoB.rotulo}
            a={a ? Number(a) : null}
            b={b ? Number(b) : null}
            aoEscolher={(x, y) => {
              setA(String(x));
              setB(String(y));
            }}
          />
        </div>
      ),
    },
  ];
  if (campoControles)
    secoes.push({
      id: "controles",
      titulo: cfg.controles ?? "Controles existentes",
      descricao: "O que já reduz a probabilidade ou o impacto hoje.",
      situacao: { tipo: "opcional" },
      conteudo: campoControles,
    });
  secoes.push({
    id: "tratamento",
    titulo: tituloTratamento,
    descricao: "O que será feito, por quem e até quando.",
    situacao: acaoObrigatoria
      ? situacao(faltamTratamento, 3)
      : { tipo: "opcional" },
    conteudo: (
      <>
        {acaoObrigatoria && (
          <CaixaDeAlerta tom="atencao" className="mb-5">
            {cfg.acaoAlta}
          </CaixaDeAlerta>
        )}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-3">{campoAcao}</div>
          <div className="sm:col-span-2">{campoResponsavel}</div>
          {campoPrazo}
        </div>
      </>
    ),
  });

  return (
    <form action={acao} noValidate className="mt-6">
      {ocultos}
      {erroGeral && <div className="mb-5">{erroGeral}</div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {secoes.map((s) => (
            <SecaoDoCadastro
              key={s.id}
              id={s.id}
              titulo={s.titulo}
              descricao={s.descricao}
              situacao={s.situacao}
            >
              {s.conteudo}
            </SecaoDoCadastro>
          ))}
        </div>
        <ColunaDeResumo
          itens={[
            {
              rotulo: cfg.classe,
              valor: classe ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`size-2.5 rounded-xs ${MARCADOR[classe]}`}
                  />
                  {CLASSES_RO[classe]} · {Number(a) * Number(b)}
                </span>
              ) : (
                <span className="font-normal text-texto-3">Não avaliado</span>
              ),
            },
            {
              rotulo: "Processo",
              valor: processo.trim() || (
                <span className="font-normal text-texto-3">Não informado</span>
              ),
            },
            {
              rotulo: "Responsável",
              valor: responsavel.trim() || (
                <span className="font-normal text-texto-3">Não definido</span>
              ),
            },
            {
              rotulo: "Prazo",
              valor: prazo ? (
                formatarData(prazo)
              ) : (
                <span className="font-normal text-texto-3">Sem prazo</span>
              ),
            },
          ]}
          obrigatorios={{
            feitos: totalObrigatorios - faltam,
            total: totalObrigatorios,
          }}
          secoes={secoes.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            situacao: s.situacao,
          }))}
        />
      </div>
      <BarraDeAcoes
        situacao={
          faltam
            ? `${faltam} ${faltam === 1 ? "campo obrigatório pendente" : "campos obrigatórios pendentes"}`
            : "Campos obrigatórios preenchidos"
        }
      >
        <Botao href={cfg.base} tamanho="grande">
          Cancelar
        </Botao>
        <Botao
          type="submit"
          disabled={salvando}
          variante="primario"
          tamanho="grande"
        >
          {textoDoBotao}
        </Botao>
      </BarraDeAcoes>
    </form>
  );
}
