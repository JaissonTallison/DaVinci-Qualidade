"use server";

import { redirect } from "next/navigation";
import {
  TIPOS_DE_ANEXO,
  novoAnexoSchema,
  type Anexo,
  type RegistroComAnexo,
} from "@davinci/types";
import { chamar, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";

/** Só caminhos internos: o retorno vem de quem montou o formulário. */
function voltarCom(voltar: string, aviso: string): string {
  const base =
    voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/";
  return `${base}${base.includes("?") ? "&" : "?"}aviso=${aviso}`;
}

export async function anexarArquivo(
  registro: RegistroComAnexo,
  registroId: string,
  voltar: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const arquivo = form.get("arquivo");
  const descricao = String(form.get("descricao") ?? "");
  if (!(arquivo instanceof File) || arquivo.size === 0)
    return erro("Escolha um arquivo.", { descricao });
  if (!(arquivo.type in TIPOS_DE_ANEXO))
    return erro("Use PDF, JPG, PNG, WEBP, DOCX ou XLSX.", { descricao });
  const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");
  const r = await chamar<Anexo>(
    novoAnexoSchema,
    {
      registro,
      registroId,
      nome: arquivo.name,
      tipo: arquivo.type,
      base64,
      descricao,
    },
    "/anexos",
    "POST",
    { descricao },
  );
  if ("erro" in r) return r;
  redirect(voltarCom(voltar, "anexado"));
}

export async function removerAnexo(
  id: string,
  voltar: string,
): Promise<EstadoDaAcao> {
  const r = await chamarApi<Anexo>(`/anexos/${id}/remover`, {
    metodo: "POST",
    corpo: {},
  });
  if (!r.ok) return { erro: r.erro };
  redirect(voltarCom(voltar, "anexo-removido"));
}

function erro(mensagem: string, valores: Record<string, string>): EstadoDaAcao {
  return {
    erro: {
      codigo: "DADOS_INVALIDOS",
      mensagem: "Verifique o arquivo.",
      detalhes: [{ campo: "arquivo", mensagem }],
    },
    valores,
  };
}
