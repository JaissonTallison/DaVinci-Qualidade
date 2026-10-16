"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarDestinadorSchema,
  atualizarProgramaSchema,
  comunicarOcorrenciaSchema,
  cumprirObrigacaoSchema,
  encerrarOcorrenciaSchema,
  medirProgramaSchema,
  ncDaOcorrenciaSchema,
  novaObrigacaoSchema,
  novaOcorrenciaSchema,
  novoDestinadorSchema,
  novoProgramaSchema,
  registrarProducaoSchema,
  type ObrigacaoLegal,
  type OcorrenciaAmbiental,
  type ProgramaAmbiental,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";
import { linhasDoFormulario } from "./linhas-do-formulario";

const vazio = (v?: string) => v || undefined;
const numero = (v?: string) => (v ? v.replace(",", ".") : undefined);

// ---------------------------------------------------------------- ocorrências

const OCORRENCIA = (id: string) => `/ambiental/ocorrencias/${id}`;

export async function criarOcorrencia(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    ...v,
    quantidade: numero(v.quantidade),
    unidade: vazio(v.unidade),
    meios: form.getAll("meios").map(String),
  };
  const r = await chamar<OcorrenciaAmbiental>(
    novaOcorrenciaSchema,
    dados,
    "/ocorrencias-ambientais",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${OCORRENCIA(r.dados.id)}?aviso=registrada`);
}

async function acaoDaOcorrencia(
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
    `/ocorrencias-ambientais/${id}/${caminho}`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${OCORRENCIA(id)}?aviso=${aviso}`);
}

export async function comunicarOcorrencia(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOcorrencia(
    id,
    "comunicacao",
    comunicarOcorrenciaSchema,
    {
      versao: versaoDe(form),
      orgao: v.orgao,
      data: v.data,
      protocolo: v.protocolo,
    },
    "comunicada",
    v,
  );
}
export async function ncDaOcorrencia(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOcorrencia(
    id,
    "nc",
    ncDaOcorrenciaSchema,
    { versao: versaoDe(form), responsavel: v.responsavel },
    "nc",
    v,
  );
}
export async function encerrarOcorrencia(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOcorrencia(
    id,
    "encerrar",
    encerrarOcorrenciaSchema,
    {
      versao: versaoDe(form),
      causas: v.causas,
      acoes: v.acoes,
      remediacao: vazio(v.remediacao),
    },
    "encerrada",
    v,
  );
}

// ---------------------------------------------------------------- obrigações

const OBRIGACOES = "/ambiental/obrigacoes";

export async function criarObrigacao(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<ObrigacaoLegal>(
    novaObrigacaoSchema,
    { ...v, descricao: vazio(v.descricao) },
    "/obrigacoes-legais",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${OBRIGACOES}?aviso=criada`);
}

export async function cumprirObrigacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    cumprirObrigacaoSchema,
    {
      versao: versaoDe(form),
      data: v.data,
      comprovante: v.comprovante,
      observacao: vazio(v.observacao),
    },
    `/obrigacoes-legais/${id}/cumprimento`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${OBRIGACOES}?aviso=cumprida`);
}

export async function excluirObrigacao(id: string): Promise<string | null> {
  const r = await chamarApi(`/obrigacoes-legais/${id}`, { metodo: "DELETE" });
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(OBRIGACOES);
  return null;
}

// ---------------------------------------------------------------- destinadores

const DESTINADORES = "/ambiental/destinadores";
const camposDoDestinador = (v: Record<string, string>) => ({
  nome: v.nome,
  cnpj: vazio(v.cnpj),
  tipo: v.tipo,
  licencaNumero: v.licencaNumero,
  licencaOrgao: v.licencaOrgao,
  licencaValidade: v.licencaValidade,
  atividades: vazio(v.atividades),
});

export async function criarDestinador(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    novoDestinadorSchema,
    camposDoDestinador(v),
    "/destinadores",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${DESTINADORES}?aviso=criado`);
}

export async function atualizarDestinador(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    atualizarDestinadorSchema,
    { versao: versaoDe(form), ...camposDoDestinador(v) },
    `/destinadores/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${DESTINADORES}?aviso=salvo`);
}

// ---------------------------------------------------------------- produção e programas

export async function registrarProducao(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    registrarProducaoSchema,
    {
      competencia: v.competencia,
      quantidade: numero(v.quantidade),
      unidade: v.unidade,
    },
    "/ecoeficiencia/producao",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(
    `/ambiental/ecoeficiencia?ano=${v.competencia?.slice(0, 4)}&aviso=producao`,
  );
}

const PROGRAMAS = "/ambiental/programas";
const camposDoPrograma = (form: FormData, v: Record<string, string>) => ({
  nome: v.nome,
  objetivo: v.objetivo,
  indicador: v.indicador,
  unidadeManual: vazio(v.unidadeManual),
  linhaDeBase: numero(v.linhaDeBase),
  anoBase: v.anoBase,
  meta: numero(v.meta),
  prazo: v.prazo,
  responsavel: v.responsavel,
  acoes: linhasDoFormulario(
    form,
    ["oQue", "responsavel", "prazo", "concluida"],
    "acoes",
  ).map((a) => ({
    ...a,
    concluida: a.concluida === "sim",
  })),
});

export async function criarPrograma(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<ProgramaAmbiental>(
    novoProgramaSchema,
    camposDoPrograma(form, v),
    "/programas-ambientais",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${PROGRAMAS}/${r.dados.id}?aviso=criado`);
}

export async function atualizarPrograma(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    atualizarProgramaSchema,
    {
      ...camposDoPrograma(form, v),
      versao: versaoDe(form),
      encerrado: v.encerrado === "sim",
    },
    `/programas-ambientais/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${PROGRAMAS}/${id}?aviso=salvo`);
}

export async function medirPrograma(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    medirProgramaSchema,
    {
      versao: versaoDe(form),
      competencia: v.competencia,
      valor: numero(v.valor),
    },
    `/programas-ambientais/${id}/medicao`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${PROGRAMAS}/${id}?aviso=medido`);
}
