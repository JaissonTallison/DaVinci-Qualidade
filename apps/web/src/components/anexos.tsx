import {
  TIPOS_DE_ANEXO,
  type Anexo,
  type RegistroComAnexo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { EnviarAnexo, RemoverAnexo } from "@/components/enviar-anexo";
import { chamarApi } from "@/lib/api";
import { formatarMomento } from "@/lib/datas";
import { painel, tituloDaSecao } from "@/lib/estilos";

function tamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/** Evidências do registro: lista com download e, para quem edita, anexar e remover. */
export async function Anexos({
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
  return (
    <section className={`${painel} mt-6`}>
      <h2 className={`${tituloDaSecao} px-5 pt-5`}>Anexos e evidências</h2>
      {!r.ok ? (
        <div className="p-5">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : r.dados.length === 0 ? (
        <p className="px-5 pt-2 text-base text-texto-2">
          Nenhum arquivo anexado.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-borda border-y border-borda">
          {r.dados.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-2.5"
            >
              <div className="min-w-0">
                <a
                  href={`/anexos/${a.id}`}
                  className="break-all text-info hover:underline"
                >
                  {a.nome}
                </a>
                <span className="ml-2 text-sm text-texto-3">
                  {TIPOS_DE_ANEXO[a.tipo]} · {tamanho(a.tamanho)} ·{" "}
                  {formatarMomento(a.criadoEm)}
                </span>
                {a.descricao && (
                  <p className="text-sm text-texto-2">{a.descricao}</p>
                )}
              </div>
              {podeEditar && <RemoverAnexo id={a.id} voltar={voltar} />}
            </li>
          ))}
        </ul>
      )}
      <div className="p-5">
        {podeEditar && r.ok && (
          <EnviarAnexo
            registro={registro}
            registroId={registroId}
            voltar={voltar}
          />
        )}
      </div>
    </section>
  );
}
