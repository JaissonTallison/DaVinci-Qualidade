"use client";

import { Paperclip } from "lucide-react";
import { useActionState } from "react";
import { TIPOS_DE_ANEXO, type RegistroComAnexo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { anexarArquivo, removerAnexo } from "@/lib/acoes-anexos";
import { botaoSecundario, campoCompacto } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function EnviarAnexo({
  registro,
  registroId,
  voltar,
}: {
  registro: RegistroComAnexo;
  registroId: string;
  voltar: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    anexarArquivo.bind(null, registro, registroId, voltar),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  return (
    <form action={enviar} className="flex flex-col gap-2">
      {erroGeral && <AvisoDeErro erro={erroGeral} />}
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="arquivo"
          type="file"
          aria-label="Arquivo"
          accept={Object.keys(TIPOS_DE_ANEXO).join(",")}
          className="max-w-full text-sm text-texto-2 file:mr-3 file:h-9 file:rounded-sm file:border file:border-borda-forte file:bg-superficie file:px-3 file:text-base file:text-texto"
          aria-invalid={Boolean(erros.arquivo)}
        />
        <input
          name="descricao"
          placeholder="Descrição (opcional)"
          aria-label="Descrição do anexo"
          maxLength={200}
          defaultValue={estado.valores?.descricao}
          className={`${campoCompacto} min-w-0 flex-1`}
        />
        <button type="submit" className={botaoSecundario} disabled={enviando}>
          <Paperclip aria-hidden size={16} strokeWidth={2} />
          {enviando ? "Enviando…" : "Anexar"}
        </button>
      </div>
      <p
        className={
          erros.arquivo ? "text-sm text-nao-conforme" : "text-sm text-texto-3"
        }
      >
        {erros.arquivo ??
          "PDF, foto (JPG, PNG, WEBP), DOCX ou XLSX, até 10 MB."}
      </p>
    </form>
  );
}

export function RemoverAnexo({ id, voltar }: { id: string; voltar: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao>(
    removerAnexo.bind(null, id, voltar),
    {},
  );
  return (
    <form action={enviar} className="inline">
      <button
        type="submit"
        className="text-sm text-texto-2 hover:text-texto hover:underline"
        disabled={enviando}
      >
        Remover
      </button>
      {estado.erro && (
        <span className="ml-2 text-sm text-nao-conforme">
          {estado.erro.mensagem}
        </span>
      )}
    </form>
  );
}
