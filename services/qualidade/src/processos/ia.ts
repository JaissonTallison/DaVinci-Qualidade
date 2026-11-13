import { randomUUID } from 'node:crypto';
import { ErroDeNegocio } from '@davinci/shared';
import type { DiagramaProcesso } from '@davinci/types';

/**
 * Geração de diagrama a partir de texto com o provedor de IA do Claude (Anthropic).
 * Chave em ANTHROPIC_API_KEY (variável de ambiente do serviço). Modelo em ANTHROPIC_MODEL
 * (padrão claude-opus-5-5). A IA PROPÕE um rascunho; a pessoa edita e salva (humano no fim).
 * Validação da resposta é feita à mão (o serviço não depende de zod).
 */

const FORMAS = [
  'terminal',
  'processo',
  'subprocesso',
  'decisao',
  'documento',
  'dados',
  'armazenamento',
  'qualidade',
] as const;
type Forma = (typeof FORMAS)[number];

interface NoIa {
  forma: Forma;
  categoria?: string;
  nome: string;
  pergunta?: string;
  responsavel?: string;
  departamento?: string;
}
interface ConexaoIa {
  de: number;
  para: number;
  rotulo?: string;
}

const ROTULO_QUALIDADE: Record<string, string> = {
  responsavel: 'Responsável',
  departamento: 'Departamento',
  documento_controlado: 'Documento controlado',
  registro: 'Registro da qualidade',
  nao_conformidade: 'Não conformidade',
  acao_corretiva: 'Ação corretiva',
  risco: 'Risco',
  controle: 'Controle operacional',
  indicador: 'Indicador',
  inspecao: 'Inspeção',
  aprovacao: 'Aprovação',
};
const ROTULO_FORMA: Record<string, string> = {
  terminal: 'Terminal',
  processo: 'Processo',
  subprocesso: 'Subprocesso',
  decisao: 'Decisão',
  documento: 'Documento',
  dados: 'Entrada de dados',
  armazenamento: 'Banco de dados',
};

const SISTEMA = `Você transforma um procedimento escrito em um fluxograma de processo.
Extraia SOMENTE o que está no texto: não invente etapas, responsáveis, decisões ou documentos.
Se algo estiver ambíguo ou faltando, não preencha (deixe de fora), não deduza.

Responda APENAS com um JSON (sem comentários, sem markdown) no formato:
{"nos":[{"forma":"...","categoria":"...","nome":"...","pergunta":"...","responsavel":"...","departamento":"..."}],
 "conexoes":[{"de":0,"para":1,"rotulo":"Sim"}]}

Regras:
- "forma" é uma de: terminal, processo, subprocesso, decisao, documento, dados, armazenamento, qualidade.
- O primeiro nó deve ser forma "terminal" com categoria "inicio"; o último, "terminal" com categoria "fim".
- Etapas de ação viram "processo". Perguntas/condições ("Se ...?") viram "decisao" (use o campo "pergunta").
- Elementos de qualidade usam forma "qualidade" com "categoria" entre: nao_conformidade, acao_corretiva, inspecao, aprovacao, risco, controle, indicador, documento_controlado, registro, responsavel, departamento.
- "de"/"para" são índices (0-based) no array "nos". Em decisões, use "rotulo":"Sim"/"Não" nas conexões.
- "responsavel" e "departamento" só quando o texto disser claramente.`;

const ehForma = (v: unknown): v is Forma =>
  typeof v === 'string' && (FORMAS as readonly string[]).includes(v);
const texto = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() ? v.slice(0, max) : undefined;

function validar(
  bruto: unknown,
): { nos: NoIa[]; conexoes: ConexaoIa[] } | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const o = bruto as Record<string, unknown>;
  const nos: NoIa[] = [];
  for (const x of (Array.isArray(o.nos) ? o.nos : []).slice(0, 120)) {
    if (!x || typeof x !== 'object') continue;
    const n = x as Record<string, unknown>;
    if (!ehForma(n.forma)) continue;
    const nome = texto(n.nome, 200);
    if (!nome) continue;
    nos.push({
      forma: n.forma,
      categoria: texto(n.categoria, 40),
      nome,
      pergunta: texto(n.pergunta, 400),
      responsavel: texto(n.responsavel, 160),
      departamento: texto(n.departamento, 160),
    });
  }
  const conexoes: ConexaoIa[] = [];
  for (const x of (Array.isArray(o.conexoes) ? o.conexoes : []).slice(0, 300)) {
    if (!x || typeof x !== 'object') continue;
    const c = x as Record<string, unknown>;
    if (typeof c.de !== 'number' || typeof c.para !== 'number') continue;
    conexoes.push({
      de: c.de,
      para: c.para,
      rotulo: texto(c.rotulo, 40),
    });
  }
  return { nos, conexoes };
}

function rotuloDe(n: NoIa): string {
  if (n.forma === 'qualidade')
    return ROTULO_QUALIDADE[n.categoria ?? ''] ?? 'Elemento';
  return ROTULO_FORMA[n.forma] ?? 'Processo';
}
function categoriaDe(n: NoIa): string {
  if (n.forma === 'terminal') return n.categoria === 'fim' ? 'fim' : 'inicio';
  if (n.forma === 'qualidade') return n.categoria ?? 'responsavel';
  return n.forma;
}
const regra = (m: string) => new ErroDeNegocio('REGRA_DE_NEGOCIO', m);

export async function gerarDiagramaComClaude(
  textoProcedimento: string,
): Promise<DiagramaProcesso> {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave)
    throw regra(
      'A IA ainda não está configurada (chave do provedor ausente). Avise o administrador.',
    );
  const modelo = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5-5';

  let resposta: Awaited<ReturnType<typeof fetch>>;
  try {
    resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': chave,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 8000,
        output_config: { effort: 'low' },
        system: SISTEMA,
        messages: [
          {
            role: 'user',
            content: `Procedimento:\n\n${textoProcedimento}\n\nResponda só com o JSON.`,
          },
        ],
      }),
    });
  } catch {
    throw regra('Não foi possível falar com o provedor de IA. Tente de novo.');
  }
  if (!resposta.ok)
    throw regra(
      `O provedor de IA recusou a solicitação (${resposta.status}).`,
    );

  const corpo = (await resposta.json()) as {
    content?: { type: string; text?: string }[];
  };
  const bruto = (corpo.content?.find((b) => b.type === 'text')?.text ?? '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  let json: unknown;
  try {
    json = JSON.parse(bruto);
  } catch {
    throw regra(
      'A IA não devolveu um diagrama válido. Tente reescrever o texto.',
    );
  }
  const validada = validar(json);
  if (!validada || validada.nos.length === 0)
    throw regra('A IA não identificou etapas no texto. Revise o conteúdo.');

  const nodes: DiagramaProcesso['nodes'] = validada.nos.map((n, i) => ({
    id: randomUUID(),
    position: { x: 260, y: 40 + i * 100 },
    type: 'no',
    data: {
      forma: n.forma,
      categoria: categoriaDe(n),
      rotulo: rotuloDe(n),
      nome: n.nome,
      ...(n.pergunta ? { pergunta: n.pergunta } : {}),
      ...(n.responsavel ? { responsavel: n.responsavel } : {}),
      ...(n.departamento ? { departamento: n.departamento } : {}),
    },
  }));
  const edges: DiagramaProcesso['edges'] = validada.conexoes
    .filter((c) => nodes[c.de] && nodes[c.para] && c.de !== c.para)
    .map((c) => ({
      id: `e_${c.de}_${c.para}`,
      source: nodes[c.de]!.id,
      target: nodes[c.para]!.id,
      markerEnd: { type: 'arrowclosed' },
      ...(c.rotulo ? { label: c.rotulo } : {}),
    }));

  return { nodes, edges };
}
