import {
  ALTURA_DO_NO,
  LARGURA_DO_NO,
  type DadosDoNo,
  type FormaDoNo,
} from "./elementos";

type NoExp = { id: string; position: { x: number; y: number }; data: DadosDoNo };
type ArestaExp = {
  source: string;
  target: string;
  sourceHandle?: string | null;
};
export type NoGerado = {
  id: string;
  type: "no";
  position: { x: number; y: number };
  data: DadosDoNo;
};
export type ArestaGerada = {
  id: string;
  source: string;
  target: string;
  markerEnd: { type: "arrowclosed" };
};

/** Id válido para BPMN (NCName não começa com dígito). */
const nid = (id: string) => `n_${id.replace(/[^A-Za-z0-9_-]/g, "")}`;
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Elemento BPMN correspondente à forma do nó. */
function elementoBpmn(d: DadosDoNo): {
  tag: string;
  extra?: string;
} {
  if (d.forma === "terminal")
    return { tag: d.categoria === "fim" ? "endEvent" : "startEvent" };
  if (d.forma === "decisao") return { tag: "exclusiveGateway" };
  if (d.forma === "subprocesso") return { tag: "subProcess" };
  return { tag: "task" };
}

/** Gera BPMN 2.0 XML (com BPMNDI) do diagrama. */
export function gerarBpmn(nos: NoExp[], arestas: ArestaExp[]): string {
  const elementos = nos
    .map((n) => {
      const { tag } = elementoBpmn(n.data);
      const nome = n.data.nome ? ` name="${esc(n.data.nome)}"` : "";
      return `    <${tag} id="${nid(n.id)}"${nome} />`;
    })
    .join("\n");
  const flows = arestas
    .map(
      (a, i) =>
        `    <sequenceFlow id="f_${i}" sourceRef="${nid(a.source)}" targetRef="${nid(a.target)}" />`,
    )
    .join("\n");

  const shapes = nos
    .map((n) => {
      const w = LARGURA_DO_NO[n.data.forma];
      const h = ALTURA_DO_NO[n.data.forma];
      return `      <bpmndi:BPMNShape id="s_${nid(n.id)}" bpmnElement="${nid(n.id)}"><dc:Bounds x="${Math.round(n.position.x)}" y="${Math.round(n.position.y)}" width="${w}" height="${h}" /></bpmndi:BPMNShape>`;
    })
    .join("\n");
  const porId = new Map(nos.map((n) => [n.id, n]));
  const edgesDi = arestas
    .map((a, i) => {
      const s = porId.get(a.source);
      const t = porId.get(a.target);
      if (!s || !t) return "";
      const sx = Math.round(s.position.x + LARGURA_DO_NO[s.data.forma] / 2);
      const sy = Math.round(s.position.y + ALTURA_DO_NO[s.data.forma]);
      const tx = Math.round(t.position.x + LARGURA_DO_NO[t.data.forma] / 2);
      const ty = Math.round(t.position.y);
      return `      <bpmndi:BPMNEdge id="e_f_${i}" bpmnElement="f_${i}"><di:waypoint x="${sx}" y="${sy}" /><di:waypoint x="${tx}" y="${ty}" /></bpmndi:BPMNEdge>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="defs_davinci" targetNamespace="http://davinci.qualidade/processos">
  <process id="processo" isExecutable="false">
${elementos}
${flows}
  </process>
  <bpmndi:BPMNDiagram id="diagrama">
    <bpmndi:BPMNPlane id="plano" bpmnElement="processo">
${shapes}
${edgesDi}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
}

const FORMA_POR_TAG: Record<string, { forma: FormaDoNo; categoria: string }> = {
  startEvent: { forma: "terminal", categoria: "inicio" },
  endEvent: { forma: "terminal", categoria: "fim" },
  task: { forma: "processo", categoria: "processo" },
  userTask: { forma: "processo", categoria: "processo" },
  serviceTask: { forma: "processo", categoria: "processo" },
  manualTask: { forma: "processo", categoria: "processo" },
  scriptTask: { forma: "processo", categoria: "processo" },
  sendTask: { forma: "processo", categoria: "processo" },
  receiveTask: { forma: "processo", categoria: "processo" },
  businessRuleTask: { forma: "processo", categoria: "processo" },
  subProcess: { forma: "subprocesso", categoria: "subprocesso" },
  exclusiveGateway: { forma: "decisao", categoria: "decisao" },
  inclusiveGateway: { forma: "decisao", categoria: "decisao" },
  parallelGateway: { forma: "decisao", categoria: "decisao" },
  dataObjectReference: { forma: "documento", categoria: "documento" },
  dataObject: { forma: "documento", categoria: "documento" },
};
const ROTULO: Record<FormaDoNo, string> = {
  terminal: "Terminal",
  processo: "Processo",
  subprocesso: "Subprocesso",
  decisao: "Decisão",
  documento: "Documento",
  dados: "Entrada de dados",
  armazenamento: "Banco de dados",
  anotacao: "Anotação",
  qualidade: "Elemento",
};

/** Lê um BPMN 2.0 XML e devolve nós/conexões compatíveis (best-effort). */
export function importarBpmn(xml: string): {
  nodes: NoGerado[];
  edges: ArestaGerada[];
} {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("Arquivo BPMN inválido.");

  // Coordenadas do BPMNDI, por bpmnElement.
  const pos = new Map<string, { x: number; y: number }>();
  for (const shape of Array.from(
    doc.getElementsByTagNameNS("*", "BPMNShape"),
  )) {
    const alvo = shape.getAttribute("bpmnElement");
    const bounds = shape.getElementsByTagNameNS("*", "Bounds")[0];
    if (alvo && bounds)
      pos.set(alvo, {
        x: Number(bounds.getAttribute("x") ?? 0),
        y: Number(bounds.getAttribute("y") ?? 0),
      });
  }

  const nodes: NoGerado[] = [];
  const vistos = new Set<string>();
  let i = 0;
  for (const [tag, mapa] of Object.entries(FORMA_POR_TAG)) {
    for (const el of Array.from(doc.getElementsByTagNameNS("*", tag))) {
      const id = el.getAttribute("id");
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      const p = pos.get(id) ?? { x: 240, y: 40 + i * 110 };
      i += 1;
      nodes.push({
        id,
        type: "no",
        position: p,
        data: {
          forma: mapa.forma,
          categoria: mapa.categoria,
          rotulo: ROTULO[mapa.forma],
          nome: el.getAttribute("name") ?? ROTULO[mapa.forma],
        },
      });
    }
  }

  const ids = new Set(nodes.map((n) => n.id));
  const edges: ArestaGerada[] = [];
  for (const fl of Array.from(
    doc.getElementsByTagNameNS("*", "sequenceFlow"),
  )) {
    const source = fl.getAttribute("sourceRef");
    const target = fl.getAttribute("targetRef");
    if (source && target && ids.has(source) && ids.has(target))
      edges.push({
        id: fl.getAttribute("id") ?? `f_${edges.length}`,
        source,
        target,
        markerEnd: { type: "arrowclosed" },
      });
  }
  return { nodes, edges };
}
