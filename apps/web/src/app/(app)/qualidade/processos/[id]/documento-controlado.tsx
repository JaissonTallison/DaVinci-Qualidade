"use client";

import { useActionState } from "react";
import type { Processo } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { criarDocumentoDoProcesso } from "@/lib/acoes-processos";
import type { EstadoDaAcao } from "@/lib/acao";

/** Gera um Documento controlado (módulo SGI) a partir do processo, para revisão/aprovação formal. */
export function CriarDocumentoControlado({ processo }: { processo: Processo }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarDocumentoDoProcesso,
    {},
  );
  return (
    <form action={acao} className="flex flex-col items-end gap-2">
      <input type="hidden" name="codigo" value={processo.codigo} />
      <input type="hidden" name="nome" value={processo.nome} />
      <input
        type="hidden"
        name="departamento"
        value={processo.departamento ?? ""}
      />
      <input type="hidden" name="elaboradoPor" value={processo.elaboradoPor} />
      <Botao
        type="submit"
        carregando={salvando}
        textoCarregando="Criando…"
      >
        Criar documento controlado
      </Botao>
      {estado.erro && (
        <div className="w-full max-w-sm">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
    </form>
  );
}
