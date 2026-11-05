"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  definirRiscosDaFuncaoSchema,
  inspecionarEquipamentoSchema,
  novoBrigadistaSchema,
  novoEquipamentoSchema,
  atualizarEquipamentoSchema,
  ordemDeServicoSstSchema,
  planoDeEmergenciaSchema,
  registrarInvestigacaoSchema,
  type Equipamento,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";
import { linhasDoFormulario } from "./linhas-do-formulario";

const vazio = (v?: string) => v || undefined;
const ACIDENTE = (id: string) => `/seguranca/acidentes/${id}`;

// ---------------------------------------------------------------- acidente

export async function registrarInvestigacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const fatos = linhasDoFormulario(
    form,
    ["fato", "componente", "antecedentes"],
    "fatos",
  ).map((f) => ({
    ...f,
    antecedentes: (f.antecedentes ?? "")
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number),
  }));
  const dados = {
    versao: versaoDe(form),
    testemunhas: linhasDoFormulario(
      form,
      ["nome", "funcao", "relato"],
      "testemunhas",
    ),
    porques: [1, 2, 3, 4, 5]
      .map((n) => String(form.get(`porque${n}`) ?? "").trim())
      .filter(Boolean),
    fatos,
  };
  const r = await chamar(
    registrarInvestigacaoSchema,
    dados,
    `/acidentes/${id}/investigacao`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${ACIDENTE(id)}?aviso=investigacao-salva#investigacao`);
}

// ---------------------------------------------------------------- PGR e função

export async function definirRiscosDaFuncao(
  funcaoId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const dados = { funcaoId, riscoIds: form.getAll("riscoIds").map(String) };
  const r = await chamar(
    definirRiscosDaFuncaoSchema,
    dados,
    `/competencias/funcoes/${funcaoId}/riscos`,
    "PUT",
  );
  if ("erro" in r) return r;
  redirect(`/cadastros/setores-e-funcoes/${funcaoId}?aviso=riscos`);
}

export async function salvarOrdemSst(
  funcaoId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    funcaoId,
    versao: String(form.get("versao") ?? ""),
    atividades: v.atividades,
    procedimentos: v.procedimentos,
    proibicoes: v.proibicoes,
    emergencia: vazio(v.emergencia),
  };
  const r = await chamar(
    ordemDeServicoSstSchema,
    dados,
    `/ordens-sst/${funcaoId}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/cadastros/setores-e-funcoes/${funcaoId}?aviso=ordem`);
}

// ---------------------------------------------------------------- equipamentos e brigada

const EQUIP = "/seguranca/equipamentos";
const camposDoEquipamento = (v: Record<string, string>) => ({
  categoria: v.categoria,
  identificacao: v.identificacao,
  local: v.local,
  detalhes: vazio(v.detalhes),
  inspecaoDias: vazio(v.inspecaoDias),
  ultimaInspecao: vazio(v.ultimaInspecao),
  ultimaRecarga: vazio(v.ultimaRecarga),
  ultimoTeste: vazio(v.ultimoTeste),
});

export async function criarEquipamento(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Equipamento>(
    novoEquipamentoSchema,
    camposDoEquipamento(v),
    "/equipamentos",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${EQUIP}/${r.dados.id}?aviso=criado`);
}

export async function atualizarEquipamento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Equipamento>(
    atualizarEquipamentoSchema,
    { versao: versaoDe(form), ...camposDoEquipamento(v) },
    `/equipamentos/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${EQUIP}/${id}?aviso=salvo`);
}

export async function inspecionarEquipamento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    versao: versaoDe(form),
    data: v.data,
    resultado: v.resultado,
    responsavel: v.responsavel,
    observacao: vazio(v.observacao),
    recarregado: v.recarregado === "sim",
    testado: v.testado === "sim",
  };
  const r = await chamar<Equipamento>(
    inspecionarEquipamentoSchema,
    dados,
    `/equipamentos/${id}/inspecao`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${EQUIP}/${id}?aviso=inspecionado`);
}

export async function mudarSituacaoDoEquipamento(
  id: string,
  versao: string,
  ativo: boolean,
): Promise<string | null> {
  const r = await chamarApi(`/equipamentos/${id}/situacao`, {
    metodo: "POST",
    corpo: { versao, ativo },
  });
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(`${EQUIP}/${id}`);
  return null;
}

const EMERGENCIA = "/seguranca/emergencia";

export async function incluirBrigadista(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    funcionarioId: v.funcionarioId,
    papel: v.papel,
    turno: vazio(v.turno),
    treinadoEm: v.treinadoEm,
  };
  const r = await chamar(novoBrigadistaSchema, dados, "/brigada", "POST", v);
  if ("erro" in r) return r;
  redirect(`${EMERGENCIA}?aviso=brigadista`);
}

export async function retirarBrigadista(id: string): Promise<string | null> {
  const r = await chamarApi(`/brigada/${id}`, { metodo: "DELETE" });
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(EMERGENCIA);
  return null;
}

export async function salvarPlanoDeEmergencia(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const dados = {
    versao: String(form.get("versao") ?? ""),
    cenarios: v.cenarios,
    alarme: vazio(v.alarme),
    rotasDeFuga: v.rotasDeFuga,
    pontoDeEncontro: v.pontoDeEncontro,
    procedimentos: v.procedimentos,
    contatos: linhasDoFormulario(form, ["nome", "telefone"], "contatos"),
  };
  const r = await chamar(
    planoDeEmergenciaSchema,
    dados,
    "/plano-de-emergencia",
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${EMERGENCIA}?aviso=plano`);
}
