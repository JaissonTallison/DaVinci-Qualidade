"use client";

import { Paperclip, Trash2 } from "@/components/icones";
import { useActionState, useState } from "react";
import { TIPOS_DE_ANEXO, type RegistroComAnexo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { anexarArquivo, removerAnexo } from "@/lib/acoes-anexos";
import { campoCompacto } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

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
        <Botao
          type="submit"
          carregando={enviando}
          textoCarregando="Enviando…"
          icone={Paperclip}
        >
          Anexar
        </Botao>
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
  // Confirmação em dois passos (sem janela nativa): o 1º clique pede confirmação, o 2º remove.
  // Evita apagar evidência por engano num clique só.
  const [confirmando, setConfirmando] = useState(false);
  return (
    <form action={enviar} className="inline-flex items-center gap-2">
      {confirmando ? (
        <>
          <span className="text-sm text-texto-2">Remover a evidência?</span>
          <Botao
            type="submit"
            carregando={enviando}
            textoCarregando="Removendo…"
            variante="perigo"
            tamanho="pequeno"
          >
            Sim, remover
          </Botao>
          <Botao
            onClick={() => setConfirmando(false)}
            disabled={enviando}
            variante="fantasma"
            tamanho="pequeno"
          >
            Não
          </Botao>
        </>
      ) : (
        <Botao
          onClick={() => setConfirmando(true)}
          variante="fantasma"
          tamanho="pequeno"
          icone={Trash2}
        >
          Remover
        </Botao>
      )}
      {estado.erro && (
        <span className="ml-2 text-sm text-nao-conforme">
          {estado.erro.mensagem}
        </span>
      )}
    </form>
  );
}
