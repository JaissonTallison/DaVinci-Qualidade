"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DiagramaProcesso } from "@davinci/types";
import {
  gerarDiagramaIaProcesso,
  salvarDiagramaProcesso,
} from "@/lib/acoes-processos";
import {
  dadosPadrao,
  PALETA,
  type ElementoDaPaleta,
} from "./elementos";
import { NoDoProcesso, type NoProcesso } from "./no-do-processo";
import {
  baixarPng,
  baixarSvg,
  baixarTexto,
  gerarSvg,
} from "./exportar-diagrama";
import { gerarBpmn, importarBpmn } from "./bpmn";
import { gerarDoTexto } from "./assistente-texto";

const TIPO_ARRASTO = "application/davinci-no";

const elementoPorChave = (chave: string): ElementoDaPaleta | undefined => {
  for (const g of PALETA) {
    const e = g.elementos.find((x) => x.chave === chave);
    if (e) return e;
  }
  return undefined;
};

interface Props {
  processoId: string;
  codigo: string;
  nome: string;
  versaoInicial: string;
  conteudoInicial: DiagramaProcesso | null;
  podeEditar: boolean;
  voltarHref: string;
}

export function EditorDeDiagrama(props: Props) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  );
}

function Editor({
  processoId,
  codigo,
  nome,
  versaoInicial,
  conteudoInicial,
  podeEditar,
  voltarHref,
}: Props) {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<NoProcesso[]>(
    (conteudoInicial?.nodes ?? []) as unknown as NoProcesso[],
  );
  const [edges, setEdges] = useState<Edge[]>(
    (conteudoInicial?.edges ?? []) as unknown as Edge[],
  );
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [assistente, setAssistente] = useState(false);
  const [texto, setTexto] = useState("");
  const [erroAssistente, setErroAssistente] = useState<string | null>(null);
  const [iaProcessando, setIaProcessando] = useState(false);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const versaoRef = useRef(versaoInicial);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const [passado, setPassado] = useState<
    { nodes: NoProcesso[]; edges: Edge[] }[]
  >([]);
  const [futuro, setFuturo] = useState<
    { nodes: NoProcesso[]; edges: Edge[] }[]
  >([]);

  const registrar = useCallback(() => {
    setPassado((p) => [
      ...p.slice(-49),
      { nodes: nodesRef.current, edges: edgesRef.current },
    ]);
    setFuturo([]);
  }, []);

  const desfazer = useCallback(() => {
    setPassado((p) => {
      if (!p.length) return p;
      const anterior = p[p.length - 1]!;
      setFuturo((f) => [
        { nodes: nodesRef.current, edges: edgesRef.current },
        ...f,
      ]);
      setNodes(anterior.nodes);
      setEdges(anterior.edges);
      setSujo(true);
      return p.slice(0, -1);
    });
  }, []);

  const refazer = useCallback(() => {
    setFuturo((f) => {
      if (!f.length) return f;
      const proximo = f[0]!;
      setPassado((p) => [
        ...p,
        { nodes: nodesRef.current, edges: edgesRef.current },
      ]);
      setNodes(proximo.nodes);
      setEdges(proximo.edges);
      setSujo(true);
      return f.slice(1);
    });
  }, []);

  const onNodesChange: OnNodesChange<NoProcesso> = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === "remove")) registrar();
      setNodes((nds) => applyNodeChanges(changes, nds));
      if (changes.some((c) => c.type !== "select" && c.type !== "dimensions"))
        setSujo(true);
    },
    [registrar],
  );

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    if (changes.some((c) => c.type !== "select")) setSujo(true);
  }, []);

  const onConnect: OnConnect = useCallback(
    (conexao) => {
      registrar();
      const label =
        conexao.sourceHandle === "sim"
          ? "Sim"
          : conexao.sourceHandle === "nao"
            ? "Não"
            : undefined;
      setEdges((eds) =>
        addEdge(
          { ...conexao, label, markerEnd: { type: MarkerType.ArrowClosed } },
          eds,
        ),
      );
      setSujo(true);
    },
    [registrar],
  );

  const onDrop = useCallback(
    (evento: ReactDragEvent) => {
      evento.preventDefault();
      const chave = evento.dataTransfer.getData(TIPO_ARRASTO);
      const el = elementoPorChave(chave);
      if (!el) return;
      const position = screenToFlowPosition({
        x: evento.clientX,
        y: evento.clientY,
      });
      registrar();
      const novo: NoProcesso = {
        id: crypto.randomUUID(),
        type: "no",
        position,
        data: dadosPadrao(el),
      };
      setNodes((nds) => nds.concat(novo));
      setSujo(true);
    },
    [registrar, screenToFlowPosition],
  );

  const onDragOver = useCallback((evento: ReactDragEvent) => {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
  }, []);

  const atualizarDado = useCallback(
    (campo: string, valor: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selecionadoId
            ? { ...n, data: { ...n.data, [campo]: valor } }
            : n,
        ),
      );
      setSujo(true);
    },
    [selecionadoId],
  );

  const excluirSelecionado = useCallback(() => {
    if (!selecionadoId) return;
    registrar();
    setNodes((nds) => nds.filter((n) => n.id !== selecionadoId));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selecionadoId && e.target !== selecionadoId,
      ),
    );
    setSelecionadoId(null);
    setSujo(true);
  }, [registrar, selecionadoId]);

  const salvar = useCallback(async () => {
    setSalvando(true);
    setErro(null);
    const conteudo = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    } as unknown as DiagramaProcesso;
    const r = await salvarDiagramaProcesso(
      processoId,
      versaoRef.current,
      conteudo,
    );
    setSalvando(false);
    if ("erro" in r) {
      setErro(r.erro.mensagem);
      return;
    }
    versaoRef.current = r.versao;
    setSujo(false);
  }, [processoId]);

  const exportar = useCallback(
    async (tipo: "png" | "svg" | "bpmn") => {
      const nome = `${codigo}-diagrama`;
      if (tipo === "bpmn") {
        const xml = gerarBpmn(nodesRef.current, edgesRef.current);
        baixarTexto(xml, `${codigo}-processo.bpmn`, "application/bpmn+xml");
        return;
      }
      const { svg, width, height } = gerarSvg(nodesRef.current, edgesRef.current);
      if (tipo === "svg") baixarSvg(svg, nome);
      else await baixarPng(svg, width, height, nome);
    },
    [codigo],
  );

  const aplicarRascunho = useCallback(
    (novos: NoProcesso[], novasArestas: Edge[]) => {
      if (novos.length === 0) return;
      registrar();
      setNodes(novos);
      setEdges(novasArestas);
      setSelecionadoId(null);
      setSujo(true);
      setAssistente(false);
      setErroAssistente(null);
    },
    [registrar],
  );

  const gerarDoTextoAgora = useCallback(() => {
    const { nodes: ns, edges: es } = gerarDoTexto(texto);
    if (ns.length === 0) {
      setErroAssistente("Escreva ao menos uma etapa (uma por linha).");
      return;
    }
    aplicarRascunho(ns as unknown as NoProcesso[], es as unknown as Edge[]);
  }, [texto, aplicarRascunho]);

  const gerarComIa = useCallback(async () => {
    setErroAssistente(null);
    setIaProcessando(true);
    const r = await gerarDiagramaIaProcesso(texto);
    setIaProcessando(false);
    if ("erro" in r) {
      setErroAssistente(r.erro.mensagem);
      return;
    }
    aplicarRascunho(
      r.diagrama.nodes as unknown as NoProcesso[],
      r.diagrama.edges as unknown as Edge[],
    );
  }, [texto, aplicarRascunho]);

  const importarArquivoBpmn = useCallback(
    async (arquivo: File) => {
      try {
        const xml = await arquivo.text();
        const { nodes: ns, edges: es } = importarBpmn(xml);
        if (ns.length === 0) {
          setErroAssistente("Nenhum elemento compatível no arquivo BPMN.");
          return;
        }
        aplicarRascunho(ns as unknown as NoProcesso[], es as unknown as Edge[]);
      } catch {
        setErroAssistente("Não foi possível ler o arquivo BPMN.");
      }
    },
    [aplicarRascunho],
  );

  const nodeTypes = useMemo(() => ({ no: NoDoProcesso }), []);
  const selecionado = nodes.find((n) => n.id === selecionadoId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-fundo">
      <header className="flex flex-wrap items-center gap-3 border-b border-borda bg-superficie px-4 py-2.5 shadow-xs">
        <Link
          href={voltarHref}
          className="text-sm font-medium text-info hover:underline"
        >
          ← Voltar ao processo
        </Link>
        <div className="min-w-0 flex-1">
          <span className="font-mono text-sm text-texto-2">{codigo}</span>{" "}
          <span className="text-sm font-medium text-texto">{nome}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-texto-2">Exportar</span>
          <button
            type="button"
            onClick={() => exportar("png")}
            className="rounded-md border border-borda px-2.5 py-1.5 text-sm text-texto"
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => exportar("svg")}
            className="rounded-md border border-borda px-2.5 py-1.5 text-sm text-texto"
          >
            SVG
          </button>
          <button
            type="button"
            onClick={() => exportar("bpmn")}
            className="rounded-md border border-borda px-2.5 py-1.5 text-sm text-texto"
          >
            BPMN
          </button>
        </div>
        {podeEditar && (
          <button
            type="button"
            onClick={() => {
              setErroAssistente(null);
              setAssistente(true);
            }}
            className="rounded-md border border-borda px-3 py-1.5 text-sm text-texto"
          >
            Gerar / importar
          </button>
        )}
        {podeEditar && (
          <div className="flex items-center gap-2">
            {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
            <span className="text-xs text-texto-2">
              {sujo ? "Alterações não salvas" : "Tudo salvo"}
            </span>
            <button
              type="button"
              onClick={desfazer}
              disabled={passado.length === 0}
              className="rounded-md border border-borda px-3 py-1.5 text-sm text-texto disabled:opacity-40"
            >
              Desfazer
            </button>
            <button
              type="button"
              onClick={refazer}
              disabled={futuro.length === 0}
              className="rounded-md border border-borda px-3 py-1.5 text-sm text-texto disabled:opacity-40"
            >
              Refazer
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || !sujo}
              className="rounded-md bg-marinho px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        )}
        {!podeEditar && (
          <span className="text-xs text-texto-2">Somente leitura</span>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {podeEditar && (
          <aside className="w-52 shrink-0 overflow-y-auto border-r border-borda bg-superficie p-3">
            <p className="mb-2 text-xs text-texto-2">
              Arraste um elemento para o canvas.
            </p>
            {PALETA.map((grupo) => (
              <div key={grupo.categoria} className="mb-4">
                <h3 className="mb-1.5 text-[11px] font-semibold tracking-[0.05em] text-texto-2 uppercase">
                  {grupo.categoria}
                </h3>
                <ul className="flex flex-col gap-1">
                  {grupo.elementos.map((el) => (
                    <li key={el.chave}>
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(TIPO_ARRASTO, el.chave);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="cursor-grab rounded-md border border-borda bg-fundo px-2.5 py-1.5 text-[13px] text-texto hover:border-marinho active:cursor-grabbing"
                      >
                        {el.rotulo}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        )}

        <div className="min-w-0 flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={({ nodes: ns }) =>
              setSelecionadoId(ns[0]?.id ?? null)
            }
            nodesDraggable={podeEditar}
            nodesConnectable={podeEditar}
            elementsSelectable
            deleteKeyCode={podeEditar ? ["Delete", "Backspace"] : null}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        {podeEditar && (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-borda bg-superficie p-4">
            {!selecionado ? (
              <p className="text-sm text-texto-2">
                Selecione um elemento para editar suas propriedades.
              </p>
            ) : (
              <PropriedadesDoNo
                no={selecionado}
                aoAlterar={atualizarDado}
                aoExcluir={excluirSelecionado}
              />
            )}
          </aside>
        )}
      </div>

      {assistente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-md bg-superficie p-5 shadow-cartao">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-semibold text-texto">
                Gerar ou importar diagrama
              </h2>
              <button
                type="button"
                onClick={() => setAssistente(false)}
                className="text-sm text-texto-2 hover:text-texto"
              >
                Fechar
              </button>
            </div>
            <p className="mt-1 text-sm text-texto-2">
              Isto substitui o diagrama atual por um rascunho. Revise e ajuste
              antes de salvar.
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium text-texto">
                A partir de um texto
              </p>
              <p className="mb-1.5 text-xs text-texto-2">
                Uma etapa por linha. Linhas que começam com “se/caso/quando” ou
                terminam com “?” viram decisão. Nada é inventado: só o que está
                no texto.
              </p>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={6}
                placeholder={
                  "1. Receber matéria-prima\n2. Conferir documentação\n3. Se aprovado?\n4. Liberar para estoque"
                }
                className="w-full rounded-md border border-borda bg-afundado px-3 py-2 text-sm text-texto"
              />
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={gerarDoTextoAgora}
                  disabled={iaProcessando}
                  className="rounded-md border border-borda px-4 py-1.5 text-sm text-texto disabled:opacity-50"
                >
                  Gerar rascunho simples
                </button>
                <button
                  type="button"
                  onClick={gerarComIa}
                  disabled={iaProcessando}
                  className="rounded-md bg-marinho px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {iaProcessando ? "Gerando com IA…" : "Gerar com IA (Claude)"}
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-borda pt-4">
              <p className="text-sm font-medium text-texto">Importar BPMN 2.0</p>
              <p className="mb-1.5 text-xs text-texto-2">
                Arquivo .bpmn ou .xml. São lidos os elementos e posições
                compatíveis.
              </p>
              <input
                type="file"
                accept=".bpmn,.xml,application/xml,text/xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importarArquivoBpmn(f);
                }}
                className="text-sm text-texto"
              />
            </div>

            {erroAssistente && (
              <p className="mt-3 text-sm text-nao-conforme">{erroAssistente}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PropriedadesDoNo({
  no,
  aoAlterar,
  aoExcluir,
}: {
  no: NoProcesso;
  aoAlterar: (campo: string, valor: string) => void;
  aoExcluir: () => void;
}) {
  const d = no.data;
  const campo =
    "w-full rounded-md border border-borda bg-afundado px-2.5 py-1.5 text-sm text-texto focus:bg-superficie";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.04em] text-texto-2 uppercase">
        {d.rotulo}
      </p>
      <Rotulo texto="Nome">
        <input
          className={campo}
          value={d.nome}
          maxLength={120}
          onChange={(e) => aoAlterar("nome", e.target.value)}
        />
      </Rotulo>
      {d.forma === "decisao" ? (
        <Rotulo texto="Pergunta ou condição">
          <textarea
            className={campo}
            rows={2}
            value={d.pergunta ?? ""}
            maxLength={300}
            onChange={(e) => aoAlterar("pergunta", e.target.value)}
          />
        </Rotulo>
      ) : (
        <>
          <Rotulo texto="Código">
            <input
              className={campo}
              value={d.codigo ?? ""}
              maxLength={30}
              onChange={(e) => aoAlterar("codigo", e.target.value)}
            />
          </Rotulo>
          <Rotulo texto="Responsável">
            <input
              className={campo}
              value={d.responsavel ?? ""}
              maxLength={120}
              onChange={(e) => aoAlterar("responsavel", e.target.value)}
            />
          </Rotulo>
          <Rotulo texto="Departamento">
            <input
              className={campo}
              value={d.departamento ?? ""}
              maxLength={120}
              onChange={(e) => aoAlterar("departamento", e.target.value)}
            />
          </Rotulo>
          <Rotulo texto="Descrição">
            <textarea
              className={campo}
              rows={3}
              value={d.descricao ?? ""}
              maxLength={1000}
              onChange={(e) => aoAlterar("descricao", e.target.value)}
            />
          </Rotulo>
        </>
      )}
      <button
        type="button"
        onClick={aoExcluir}
        className="mt-1 self-start rounded-md border border-borda px-3 py-1.5 text-sm text-nao-conforme hover:border-nao-conforme"
      >
        Excluir elemento
      </button>
    </div>
  );
}

function Rotulo({
  texto,
  children,
}: {
  texto: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-texto-2">{texto}</span>
      {children}
    </label>
  );
}
