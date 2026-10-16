"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  avaliarFornecedorSchema,
  avaliarOsSchema,
  cancelarOsSchema,
  concluirOsSchema,
  iniciarOsSchema,
  novaOsSchema,
  registrarRespostaNpsSchema,
  analisarReclamacaoSchema,
  atualizarContratoSchema,
  atualizarServicoDoCatalogoSchema,
  criarConviteSchema,
  encerrarContratoSchema,
  encerrarReclamacaoSchema,
  novaReclamacaoSchema,
  novoContratoSchema,
  novoServicoDoCatalogoSchema,
  registrarExecucaoSchema,
  responderPesquisaSchema,
  responderReclamacaoSchema,
  situacaoDoServicoSchema,
  type ConviteDePesquisa,
  type Contrato,
  type OrdemDeServico,
  type Reclamacao,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";
import { linhasDoFormulario } from "./linhas-do-formulario";

const OS = "/servicos/ordens";

export async function criarOs(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...valores,
    prazo: valores.prazo || undefined,
    contratoId: valores.contratoId || undefined,
    servicoId: valores.servicoId || undefined,
  };
  const r = await chamar<OrdemDeServico>(
    novaOsSchema,
    dados,
    "/ordens-de-servico",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${OS}/${r.dados.id}?aviso=criada`);
}

async function acaoDaOs(
  id: string,
  caminho: string,
  schema: Parameters<typeof chamar>[0],
  dados: Record<string, unknown>,
  aviso: string,
  valores: Record<string, string> = {},
): Promise<EstadoDaAcao> {
  const r = await chamar(
    schema,
    dados,
    `/ordens-de-servico/${id}/${caminho}`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${OS}/${id}?aviso=${aviso}`);
}

export async function iniciarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  return acaoDaOs(
    id,
    "iniciar",
    iniciarOsSchema,
    { versao: versaoDe(form) },
    "iniciada",
  );
}
export async function concluirOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "concluir",
    concluirOsSchema,
    {
      versao: versaoDe(form),
      relatorio: v.relatorio,
      recebidoPor: v.recebidoPor || undefined,
    },
    "concluida",
    v,
  );
}
export async function cancelarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "cancelar",
    cancelarOsSchema,
    { versao: versaoDe(form), motivo: v.motivo },
    "cancelada",
    v,
  );
}
export async function avaliarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "avaliacao",
    avaliarOsSchema,
    { versao: versaoDe(form), nota: v.nota, comentario: v.comentario },
    "avaliada",
    v,
  );
}

export async function registrarNps(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    registrarRespostaNpsSchema,
    valores,
    "/nps",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/servicos/nps?aviso=registrada");
}

export async function avaliarFornecedor(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    avaliarFornecedorSchema,
    valores,
    "/avaliacoes-de-fornecedores",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/servicos/fornecedores?aviso=avaliado");
}

const vazio = (v?: string) => v || undefined;

/** Checklist, horas e materiais da OS em execução: grava a lista inteira. */
export async function registrarExecucao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const checklist = form.getAll("passo_item").map((item, i) => ({
    item: String(item),
    status: String(form.get(`passo_status_${i}`) ?? "pendente"),
    observacao: String(form.get(`passo_obs_${i}`) ?? ""),
  }));
  const dados = {
    versao: versaoDe(form),
    checklist,
    apontamentos: linhasDoFormulario(
      form,
      ["data", "tecnico", "horas", "descricao"],
      "apontamentos",
    ),
    materiais: linhasDoFormulario(
      form,
      ["descricao", "quantidade", "unidade"],
      "materiais",
    ),
  };
  const r = await chamar(
    registrarExecucaoSchema,
    dados,
    `/ordens-de-servico/${id}/execucao`,
    "PUT",
    textos(form),
  );
  if ("erro" in r) return r;
  redirect(`${OS}/${id}?aviso=execucao#execucao`);
}

// ---------------------------------------------------------------- catálogo

const CATALOGO = "/servicos/catalogo";
const passos = (form: FormData) =>
  String(form.get("checklist") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export async function criarServicoDoCatalogo(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    nome: v.nome,
    descricao: vazio(v.descricao),
    horasPadrao: vazio(v.horasPadrao),
    checklist: passos(form),
  };
  const r = await chamar(
    novoServicoDoCatalogoSchema,
    dados,
    "/catalogo-de-servicos",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${CATALOGO}?aviso=criado`);
}

export async function atualizarServicoDoCatalogo(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    versao: versaoDe(form),
    nome: v.nome,
    descricao: vazio(v.descricao),
    horasPadrao: vazio(v.horasPadrao),
    checklist: passos(form),
  };
  const r = await chamar(
    atualizarServicoDoCatalogoSchema,
    dados,
    `/catalogo-de-servicos/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${CATALOGO}?aviso=salvo`);
}

export async function mudarSituacaoDoServico(
  id: string,
  versao: string,
  ativo: boolean,
): Promise<string | null> {
  if (!situacaoDoServicoSchema.safeParse({ versao, ativo }).success)
    return "Dados inválidos.";
  const r = await chamarApi(`/catalogo-de-servicos/${id}/situacao`, {
    metodo: "POST",
    corpo: { versao, ativo },
  });
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(CATALOGO);
  return null;
}

// ---------------------------------------------------------------- contratos

const CONTRATOS = "/servicos/contratos";
const camposDoContrato = (v: Record<string, string>) => ({
  objeto: v.objeto,
  inicio: v.inicio,
  fim: v.fim,
  prazoAtendimentoDias: v.prazoAtendimentoDias,
  metaNoPrazo: vazio(v.metaNoPrazo),
  valorMensal: vazio(v.valorMensal?.replace(",", ".")),
  observacoes: vazio(v.observacoes),
});

export async function criarContrato(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Contrato>(
    novoContratoSchema,
    { clienteId: v.clienteId, ...camposDoContrato(v) },
    "/contratos",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${CONTRATOS}/${r.dados.id}?aviso=criado`);
}

export async function atualizarContrato(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Contrato>(
    atualizarContratoSchema,
    { versao: versaoDe(form), ...camposDoContrato(v) },
    `/contratos/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${CONTRATOS}/${id}?aviso=salvo`);
}

export async function encerrarContrato(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Contrato>(
    encerrarContratoSchema,
    { versao: versaoDe(form), motivo: v.motivo },
    `/contratos/${id}/encerrar`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${CONTRATOS}/${id}?aviso=encerrado`);
}

// ---------------------------------------------------------------- reclamações

const RECLAMACOES = "/servicos/reclamacoes";

export async function criarReclamacao(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    ...v,
    produto: vazio(v.produto),
    osId: vazio(v.osId),
    prazoResposta: vazio(v.prazoResposta),
  };
  const r = await chamar<Reclamacao>(
    novaReclamacaoSchema,
    dados,
    "/reclamacoes",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${RECLAMACOES}/${r.dados.id}?aviso=registrada`);
}

async function acaoDaReclamacao(
  id: string,
  caminho: string,
  schema: Parameters<typeof chamar>[0],
  dados: Record<string, unknown>,
  aviso: string,
  v: Record<string, string>,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    schema,
    dados,
    `/reclamacoes/${id}/${caminho}`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${RECLAMACOES}/${id}?aviso=${aviso}`);
}

export async function analisarReclamacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaReclamacao(
    id,
    "analise",
    analisarReclamacaoSchema,
    {
      versao: versaoDe(form),
      procedente:
        v.procedente === "sim"
          ? true
          : v.procedente === "nao"
            ? false
            : undefined,
      analise: v.analise,
      abrirNc: v.abrirNc === "sim",
      responsavelNc: vazio(v.responsavelNc),
      gravidadeNc: vazio(v.gravidadeNc),
    },
    "analisada",
    v,
  );
}

export async function responderReclamacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaReclamacao(
    id,
    "resposta",
    responderReclamacaoSchema,
    { versao: versaoDe(form), resposta: v.resposta },
    "respondida",
    v,
  );
}

export async function encerrarReclamacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaReclamacao(
    id,
    "encerrar",
    encerrarReclamacaoSchema,
    {
      versao: versaoDe(form),
      clienteSatisfeito:
        v.clienteSatisfeito === "sim"
          ? true
          : v.clienteSatisfeito === "nao"
            ? false
            : undefined,
      observacao: vazio(v.observacao),
    },
    "encerrada",
    v,
  );
}

// ---------------------------------------------------------------- pesquisa por link

/** Gera o convite e volta para a tela de origem mostrando o link. */
export async function criarConvite(
  voltar: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = { clienteId: v.clienteId, osId: vazio(v.osId) };
  const r = await chamar<ConviteDePesquisa>(
    criarConviteSchema,
    dados,
    "/pesquisas",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  const destino = voltar.startsWith("/servicos/") ? voltar : "/servicos/nps";
  redirect(
    `${destino}${destino.includes("?") ? "&" : "?"}convite=${r.dados.id}`,
  );
}

/** Resposta pública do cliente (sem login). */
export async function responderPesquisa(
  token: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    token,
    nota: v.nota,
    notaOs: vazio(v.notaOs),
    comentario: vazio(v.comentario),
  };
  const valida = responderPesquisaSchema.safeParse(dados);
  if (!valida.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Escolha uma nota de 0 a 10.",
      },
      valores: v,
    };
  const r = await chamarApi(`/pesquisas/publica/${encodeURIComponent(token)}`, {
    metodo: "POST",
    corpo: {
      nota: dados.nota,
      notaOs: dados.notaOs,
      comentario: dados.comentario,
    },
    publica: true,
  });
  if (!r.ok) return { erro: r.erro, valores: v };
  redirect(`/pesquisa/${token}?obrigado=1`);
}
