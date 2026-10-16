import { Paperclip } from "lucide-react";
import type { Anexo, RegistroComAnexo } from "@davinci/types";
import { EnviarAnexo, RemoverAnexo } from "@/components/enviar-anexo";
import { chamarApi } from "@/lib/api";

/**
 * Evidência de uma linha (tarefa do plano, item da inspeção): os arquivos em linha e, para quem edita,
 * o envio recolhido. A permissão é a do módulo dono do registro, como nos anexos do registro inteiro.
 */
export async function AnexosDoItem({
  registro,
  registroId,
  voltar,
  podeEditar,
}: {
  registro: RegistroComAnexo;
  registroId: string;
  voltar: string;
  podeEditar: boolean;
}) {
  const r = await chamarApi<Anexo[]>(
    `/anexos?registro=${registro}&registroId=${registroId}`,
  );
  const lista = r.ok ? r.dados : [];
  return (
    <div className="flex flex-col gap-1.5">
      {!r.ok && <p className="text-sm text-nao-conforme">{r.erro.mensagem}</p>}
      {lista.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {lista.map((a) => (
            <li key={a.id} className="inline-flex items-center gap-1.5">
              <Paperclip
                aria-hidden
                size={14}
                strokeWidth={2}
                className="shrink-0 text-texto-3"
              />
              <a
                href={`/anexos/${a.id}`}
                className="break-all text-info hover:underline"
              >
                {a.nome}
              </a>
              {podeEditar && <RemoverAnexo id={a.id} voltar={voltar} />}
            </li>
          ))}
        </ul>
      )}
      {podeEditar && r.ok && (
        <details>
          <summary className="cursor-pointer text-sm text-info">
            {lista.length ? "Anexar outra evidência" : "Anexar evidência"}
          </summary>
          <div className="mt-2">
            <EnviarAnexo
              registro={registro}
              registroId={registroId}
              voltar={voltar}
            />
          </div>
        </details>
      )}
      {!podeEditar && lista.length === 0 && (
        <span className="text-sm text-texto-3">Sem evidência anexada</span>
      )}
    </div>
  );
}
